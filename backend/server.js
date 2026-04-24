import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import aiRoutes from "./routes/ai.js";
import taskRoutes from "./routes/taskRoutes.js";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express(); // ✅ FIRST create app

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});

app.use("/api/auth", limiter);
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tasks", taskRoutes);

// Create HTTP server
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: { origin: "*" }
});

// Store participants in memory: roomId -> map of socketId -> participant info
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, userId, userName }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    socket.userName = userName;
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    const room = rooms.get(roomId);
    
    // Notify others in the room
    socket.to(roomId).emit("user-joined", { socketId: socket.id, userId, userName });
    
    // Add current user to room state
    room.set(socket.id, { socketId: socket.id, userId, userName, isMuted: false, isVideoOff: false });

    // Send existing participants to the new user
    const participants = Array.from(room.values()).filter(p => p.socketId !== socket.id);
    socket.emit("room-participants", participants);
    
    console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
  });

  socket.on("webrtc-offer", ({ to, offer, from, fromName }) => {
    io.to(to).emit("webrtc-offer", { offer, from, fromName });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    // Frontend sends answer without 'from', but it needs it on receive, so we inject socket.id
    io.to(to).emit("webrtc-answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("send-message", (msgPayload) => {
    // msgPayload contains: roomId, message, userId, userName, meetingId
    const message = {
      id: Date.now().toString(),
      message: msgPayload.message,
      userId: msgPayload.userId,
      userName: msgPayload.userName,
      timestamp: new Date().toISOString()
    };
    io.to(msgPayload.roomId).emit("receive-message", message);
  });

  socket.on("typing-start", ({ roomId, userName }) => {
    socket.to(roomId).emit("user-typing", { userName, isTyping: true });
  });

  socket.on("typing-stop", ({ roomId, userName }) => {
    socket.to(roomId).emit("user-typing", { userName, isTyping: false });
  });

  socket.on("toggle-audio", ({ roomId, userId, isMuted }) => {
    // Optionally update room state
    if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
      rooms.get(roomId).get(socket.id).isMuted = isMuted;
    }
    // Broadcast if needed, frontend might not have listener yet but good to have
    socket.to(roomId).emit("user-toggled-audio", { socketId: socket.id, isMuted });
  });

  socket.on("toggle-video", ({ roomId, userId, isVideoOff }) => {
    if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
      rooms.get(roomId).get(socket.id).isVideoOff = isVideoOff;
    }
    socket.to(roomId).emit("user-toggled-video", { socketId: socket.id, isVideoOff });
  });

  socket.on("end-meeting", ({ roomId }) => {
    io.to(roomId).emit("meeting-ended");
    rooms.delete(roomId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomId = socket.roomId;
    
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      
      // Clean up empty rooms
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
      
      socket.to(roomId).emit("user-left", { socketId: socket.id, userName: socket.userName });
    }
  });
});

// Connect DB + start server
const PORT = 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    server.listen(PORT, () => {  // ✅ ONLY THIS
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch(err => console.log("DB Error:", err));
