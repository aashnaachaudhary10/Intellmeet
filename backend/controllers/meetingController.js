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

// Create Meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledTime } = req.body;
    const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const host = req.user?.name || "Host";

    const newMeeting = await prisma.meeting.create({
      data: {
        title: title || "New Meeting",
        description: description || "",
        hostId: req.user.id,
        meetingCode,
        participants: [host],
        recordingFolder: `meeting-${meetingCode}`,
        startedAt: scheduledTime ? undefined : new Date(),
        status: scheduledTime ? "scheduled" : "active",
      },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 201, "Meeting created successfully", { meeting: newMeeting });
  } catch (err) {
    console.error("Create Meeting Error:", err);
    return sendError(res, 500, err.message);
  }
};

export const startMeeting = async (req, res) => {
  try {
    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        status: "active",
        startedAt: new Date(),
      },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Meeting started", { meeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const endMeeting = async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
    });

    if (!meeting) return sendError(res, 404, "Meeting not found");

    const endedAt = new Date();
    const duration = calculateDurationMinutes(meeting.startedAt, endedAt);

    const updatedMeeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        status: "ended",
        endedAt,
        duration,
      },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Meeting ended", { meeting: updatedMeeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const saveTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;

    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: { transcript: transcript || "" },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Transcript saved", { meeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const saveSummary = async (req, res) => {
  try {
    const { summary, keyPoints = [], actionItems = [] } = req.body;

    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        summary: summary || "",
        keyPoints,
        actionItems,
      },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Summary saved", { meeting });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const saveRecordingPart = async (req, res) => {
  try {
    const { key, url, name, size, partNumber, uploadedBy, uploadedByName, folder } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    if (!meeting) return sendError(res, 404, "Meeting not found");

    const parts = Array.isArray(meeting.recordingParts) ? [...meeting.recordingParts] : [];

    const exists = parts.some((p) => p.partNumber === partNumber);
    if (exists) {
      return sendSuccess(res, 200, "Recording part already exists", { meeting });
    }

    const updatedParts = [...parts, { key, url, name, size, partNumber, uploadedBy, uploadedByName }];

    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        recordingFolder: folder,
        recordingParts: updatedParts,
      },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Recording part saved", { meeting: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const joinMeeting = async (req, res) => {
  try {
    const { meetingCode, meetingId, userName } = req.body;

    const meeting = await prisma.meeting.findFirst({
      where: { meetingCode: meetingCode || meetingId },
    });

    if (!meeting) return sendError(res, 404, "Meeting not found");

    const participants = Array.isArray(meeting.participants) ? [...meeting.participants] : [];
    const lowerName = (userName || "").trim();

    if (lowerName && !participants.some((p) => String(p).toLowerCase() === lowerName.toLowerCase())) {
      participants.push(lowerName);
    }

    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: { participants },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Joined meeting successfully", { meeting: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    return sendSuccess(res, 200, "Dashboard data fetched", {
      totalMeetings: meetings.length,
      meetings,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const getMeetingById = async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: {
        host: { select: HOST_SELECT },
      },
    });

    if (!meeting) return sendError(res, 404, "Meeting not found");

    return sendSuccess(res, 200, "Meeting fetched", { meeting });
  } catch (err) {
    return sendError(res, 500, "Invalid Meeting ID or Server Error");
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
    });

    if (!meeting) return sendError(res, 404, "Meeting not found");

    await prisma.meeting.delete({
      where: { id: req.params.id },
    });

    return sendSuccess(res, 200, "Meeting deleted successfully");
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
