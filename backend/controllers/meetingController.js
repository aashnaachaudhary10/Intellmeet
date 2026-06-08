import { prisma } from "../config/prisma.js";
import { sendSuccess, sendError } from "../utils/response.js";

const HOST_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
};

const calculateDurationMinutes = (startedAt, endedAt = new Date()) => {
  if (!startedAt) return 0;
  return Math.max(1, Math.round((new Date(endedAt) - new Date(startedAt)) / 60000));
};

// Generate a unique meeting code with up to 3 retries on collision
const generateUniqueMeetingCode = async () => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await prisma.meeting.findUnique({ where: { meetingCode: code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique meeting code. Please try again.");
};

// ── Create Meeting ─────────────────────────────────────────────────
export const createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledTime } = req.body;
    const meetingCode = await generateUniqueMeetingCode();
    const hostName = req.user?.name || "Host";

    const newMeeting = await prisma.meeting.create({
      data: {
        title: title || "New Meeting",
        description: description || "",
        hostId: req.user.id,
        meetingCode,
        // Store participants as objects: { userId, userName, joinedAt }
        participants: [{ userId: req.user.id, userName: hostName, joinedAt: new Date().toISOString() }],
        recordingFolder: `meeting-${meetingCode}`,
        startedAt: scheduledTime ? undefined : new Date(),
        status: scheduledTime ? "scheduled" : "active",
      },
      include: { host: { select: HOST_SELECT } },
    });

    return sendSuccess(res, 201, "Meeting created successfully", { meeting: newMeeting });
  } catch (err) {
    console.error("Create Meeting Error:", err);
    return sendError(res, 500, err.message);
  }
};

// ── Start Meeting ──────────────────────────────────────────────────
export const startMeeting = async (req, res) => {
  try {
    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { status: "active", startedAt: new Date() },
      include: { host: { select: HOST_SELECT } },
    });
    return sendSuccess(res, 200, "Meeting started", { meeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── End Meeting ────────────────────────────────────────────────────
export const endMeeting = async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!meeting) return sendError(res, 404, "Meeting not found");

    const endedAt = new Date();
    const duration = calculateDurationMinutes(meeting.startedAt, endedAt);

    const updatedMeeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { status: "ended", endedAt, duration },
      include: { host: { select: HOST_SELECT } },
    });

    return sendSuccess(res, 200, "Meeting ended", { meeting: updatedMeeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Join Meeting ───────────────────────────────────────────────────
export const joinMeeting = async (req, res) => {
  try {
    const { meetingCode, meetingId, userName } = req.body;
    const userId = req.user?.id;
    const safeUserName = req.user?.name || userName || "Guest";

    const meeting = await prisma.meeting.findFirst({
      where: { meetingCode: meetingCode || meetingId },
    });

    if (!meeting) return sendError(res, 404, "Meeting not found");
    if (meeting.status === "ended") return sendError(res, 403, "Meeting has ended");

    // Participants stored as objects with userId
    const participants = Array.isArray(meeting.participants) ? [...meeting.participants] : [];

    // Only add if not already in the list (by userId)
    const alreadyJoined = participants.some(
      (p) => (typeof p === "object" ? p.userId : p) === userId
    );

    if (!alreadyJoined) {
      participants.push({
        userId,
        userName: safeUserName,
        joinedAt: new Date().toISOString(),
      });
    }

    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: { participants },
      include: { host: { select: HOST_SELECT } },
    });

    return sendSuccess(res, 200, "Joined meeting successfully", { meeting: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Leave Meeting (participant leaves without ending) ──────────────
export const leaveMeeting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!meeting) return sendError(res, 404, "Meeting not found");

    // Update leftAt for this participant rather than removing them (preserves history)
    const participants = (Array.isArray(meeting.participants) ? meeting.participants : []).map(
      (p) => {
        if (typeof p === "object" && p.userId === userId) {
          return { ...p, leftAt: new Date().toISOString() };
        }
        return p;
      }
    );

    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { participants },
      include: { host: { select: HOST_SELECT } },
    });

    return sendSuccess(res, 200, "Left meeting", { meeting: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Dashboard ──────────────────────────────────────────────────────
// Returns meetings where user is host OR a participant
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user?.id;

    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
      include: { host: { select: HOST_SELECT } },
    });

    // Filter: include meetings where user is host OR appears in participants array
    const userMeetings = meetings.filter((m) => {
      if (m.hostId === userId) return true;
      if (!Array.isArray(m.participants)) return false;
      return m.participants.some((p) =>
        typeof p === "object" ? p.userId === userId : p === userId
      );
    });

    return sendSuccess(res, 200, "Dashboard data fetched", {
      totalMeetings: userMeetings.length,
      meetings: userMeetings,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Get Meeting By ID ──────────────────────────────────────────────
export const getMeetingById = async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: { host: { select: HOST_SELECT } },
    });
    if (!meeting) return sendError(res, 404, "Meeting not found");
    return sendSuccess(res, 200, "Meeting fetched", { meeting });
  } catch (err) {
    return sendError(res, 500, "Invalid Meeting ID or Server Error");
  }
};

// ── Save Transcript ────────────────────────────────────────────────
export const saveTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;
    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { transcript: transcript || "" },
      include: { host: { select: HOST_SELECT } },
    });
    return sendSuccess(res, 200, "Transcript saved", { meeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Save Summary ───────────────────────────────────────────────────
export const saveSummary = async (req, res) => {
  try {
    const { summary, keyPoints = [], actionItems = [] } = req.body;
    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { summary: summary || "", keyPoints, actionItems },
      include: { host: { select: HOST_SELECT } },
    });
    return sendSuccess(res, 200, "Summary saved", { meeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Save Recording Part ────────────────────────────────────────────
export const saveRecordingPart = async (req, res) => {
  try {
    const { key, url, name, size, partNumber, uploadedBy, uploadedByName, folder } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: { host: { select: HOST_SELECT } },
    });
    if (!meeting) return sendError(res, 404, "Meeting not found");

    const parts = Array.isArray(meeting.recordingParts) ? [...meeting.recordingParts] : [];
    if (parts.some((p) => p.partNumber === partNumber)) {
      return sendSuccess(res, 200, "Recording part already exists", { meeting });
    }

    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        recordingFolder: folder,
        recordingParts: [...parts, { key, url, name, size, partNumber, uploadedBy, uploadedByName }],
      },
      include: { host: { select: HOST_SELECT } },
    });
    return sendSuccess(res, 200, "Recording part saved", { meeting: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// ── Delete Meeting ─────────────────────────────────────────────────
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!meeting) return sendError(res, 404, "Meeting not found");
    await prisma.meeting.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, "Meeting deleted successfully");
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
