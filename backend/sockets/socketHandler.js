import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";

// roomId -> Map<socketId, participantInfo>
const rooms = new Map();

// userId -> socketId  (for reconnect deduplication)
const userSocketMap = new Map();

export function registerSocketHandlers(io) {
  // ── Auth middleware for every socket connection ───────────────────
  // Clients must pass token in socket.auth.token so we know who they are.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          socket.userId = decoded.id || decoded.sub;
          socket.userName = decoded.name || decoded.userName || null;
        }
      } catch (_) {
        // invalid token — identity will come from join-room payload
      }
    }
    // Always allow connection; join-room fills in userId/userName as fallback
    next();
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id} user: ${socket.userName}`);

    // ── join-room ──────────────────────────────────────────────────
    socket.on("join-room", ({ roomId, userId: payloadUserId, userName }) => {
      // Use token-verified values when available, fall back to payload
      const safeUserName = socket.userName || userName || "Guest";
      const userId = socket.userId || payloadUserId;
      // Persist on socket so disconnect handler can reference them
      socket.userId = userId;
      socket.userName = safeUserName;

      socket.join(roomId);
      socket.roomId = roomId;

      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const room = rooms.get(roomId);

      // Detect reconnect: if this userId already has a stale socket in this room, remove it
      const prevSocketId = userSocketMap.get(`${roomId}:${userId}`);
      if (prevSocketId && prevSocketId !== socket.id && room.has(prevSocketId)) {
        room.delete(prevSocketId);
        // Don't emit user-joined again for a reconnect — just quietly replace
      }

      userSocketMap.set(`${roomId}:${userId}`, socket.id);

      const isReconnect = prevSocketId != null && prevSocketId !== socket.id;

      // Add / update this participant in room state
      room.set(socket.id, {
        socketId: socket.id,
        userId,
        userName: safeUserName,
        isMuted: false,
        isVideoOff: false,
      });

      // Send existing participants list to the joining user
      const others = Array.from(room.values()).filter(
        (p) => p.socketId !== socket.id
      );
      socket.emit("room-participants", others);

      // Only tell others about a genuine new join, not a reconnect
      if (!isReconnect) {
        socket.to(roomId).emit("user-joined", {
          socketId: socket.id,
          userId,
          userName: safeUserName,
        });
      }

      console.log(
        `[socket] ${safeUserName} ${isReconnect ? "reconnected to" : "joined"} room ${roomId}`
      );
    });

    // ── WebRTC signaling ───────────────────────────────────────────
    socket.on("webrtc-offer", ({ to, offer, from, fromName }) => {
      io.to(to).emit("webrtc-offer", { offer, from: socket.id, fromName: socket.userName });
    });

    socket.on("webrtc-answer", ({ to, answer }) => {
      io.to(to).emit("webrtc-answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      if (!candidate) return; // ignore the bogus bare ice-candidate emits
      io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    // ── Screen share signals ───────────────────────────────────────
    // These let remote peers know which stream type to expect
    socket.on("screen-share-start", ({ roomId }) => {
      socket.to(roomId).emit("peer-screen-share-start", { socketId: socket.id });
    });

    socket.on("screen-share-stop", ({ roomId }) => {
      socket.to(roomId).emit("peer-screen-share-stop", { socketId: socket.id });
    });

    // ── Chat ───────────────────────────────────────────────────────
    socket.on("send-message", async (msgPayload) => {
      const message = {
        id: Date.now().toString(),
        message: msgPayload.message,
        userId: socket.userId,         // always use server-verified id
        userName: socket.userName,
        timestamp: new Date().toISOString(),
      };

      if (msgPayload.meetingId) {
        try {
          const meeting = await prisma.meeting.findUnique({
            where: { id: msgPayload.meetingId },
          });
          if (meeting) {
            const chatEntry = {
              sender: socket.userId,
              senderName: socket.userName,
              message: msgPayload.message,
              timestamp: message.timestamp,
            };
            await prisma.meeting.update({
              where: { id: msgPayload.meetingId },
              data: {
                chatMessages: [
                  ...(Array.isArray(meeting.chatMessages) ? meeting.chatMessages : []),
                  chatEntry,
                ],
              },
            });
          }
        } catch (err) {
          console.error("[socket] Failed to save chat message:", err.message);
        }
      }

      io.to(msgPayload.roomId).emit("receive-message", message);
    });

    // ── Transcript ─────────────────────────────────────────────────
    // Only broadcast to other peers; DB write is handled by REST endpoint
    // (saves the host-only transcript via PATCH /meetings/:id/transcript)
    socket.on("transcript-update", ({ roomId, text }) => {
      socket.to(roomId).emit("transcript-update", { text });
    });

    // ── Typing indicators ──────────────────────────────────────────
    socket.on("typing-start", ({ roomId }) => {
      socket.to(roomId).emit("user-typing", {
        userName: socket.userName,
        isTyping: true,
      });
    });

    socket.on("typing-stop", ({ roomId }) => {
      socket.to(roomId).emit("user-typing", {
        userName: socket.userName,
        isTyping: false,
      });
    });

    // ── Media toggles ──────────────────────────────────────────────
    socket.on("toggle-audio", ({ roomId, isMuted }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) room.get(socket.id).isMuted = isMuted;
      socket.to(roomId).emit("user-toggled-audio", { socketId: socket.id, isMuted });
    });

    socket.on("toggle-video", ({ roomId, isVideoOff }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) room.get(socket.id).isVideoOff = isVideoOff;
      socket.to(roomId).emit("user-toggled-video", { socketId: socket.id, isVideoOff });
    });

    // ── End meeting (host only) ────────────────────────────────────
    socket.on("end-meeting", ({ roomId }) => {
      io.to(roomId).emit("meeting-ended");
      // Clean up room state
      if (rooms.has(roomId)) {
        rooms.get(roomId).forEach((_, sid) => {
          const entry = [...userSocketMap.entries()].find(
            ([, v]) => v === sid
          );
          if (entry) userSocketMap.delete(entry[0]);
        });
        rooms.delete(roomId);
      }
    });

    // ── Leave room (participant voluntarily leaves) ────────────────
    socket.on("leave-room", ({ roomId }) => {
      _handleLeave(socket, roomId, io);
    });

    // ── Disconnect ─────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
      if (socket.roomId) {
        _handleLeave(socket, socket.roomId, io);
      }
    });
  });
}

// ── Shared leave logic ─────────────────────────────────────────────
function _handleLeave(socket, roomId, io) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(socket.id);

  // Remove from userId->socketId map only if this socket is still the current one
  const key = `${roomId}:${socket.userId}`;
  if (userSocketMap.get(key) === socket.id) {
    userSocketMap.delete(key);
  }

  if (room.size === 0) rooms.delete(roomId);

  socket.to(roomId).emit("user-left", {
    socketId: socket.id,
    userName: socket.userName,
  });

  socket.leave(roomId);
}