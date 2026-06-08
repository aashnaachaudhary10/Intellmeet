import express from "express";
const router = express.Router();
import authMiddleware from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

import {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  deleteMeeting,
  getDashboardData,
  getMeetingById,
  startMeeting,
  endMeeting,
  saveTranscript,
  saveSummary,
  saveRecordingPart,
} from "../controllers/meetingController.js";
import {
  createMeetingSchema,
  joinMeetingSchema,
} from "../validators/authValidators.js";

router.post("/create", authMiddleware, validateRequest(createMeetingSchema, "body"), createMeeting);
router.post("/join", authMiddleware, validateRequest(joinMeetingSchema, "body"), joinMeeting);
router.delete("/delete/:id", authMiddleware, deleteMeeting);
router.get("/dashboard", authMiddleware, getDashboardData);
router.patch("/:id/start", authMiddleware, startMeeting);
router.patch("/:id/end", authMiddleware, endMeeting);
// New: participant leave without ending the meeting
router.patch("/:id/leave", authMiddleware, leaveMeeting);
router.patch("/:id/transcript", authMiddleware, saveTranscript);
router.patch("/:id/summary", authMiddleware, saveSummary);
router.patch("/:id/recording-part", authMiddleware, saveRecordingPart);
router.get("/:id", authMiddleware, getMeetingById);

export default router;
