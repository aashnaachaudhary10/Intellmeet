import express from "express";
const router = express.Router();
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createMeeting,
  joinMeeting,
  deleteMeeting,
  getDashboardData,
  getMeetingById,
} from "../controllers/meetingController.js";

router.post("/create", authMiddleware, createMeeting);
router.post("/join", authMiddleware, joinMeeting);
router.delete("/delete/:id", authMiddleware, deleteMeeting);
router.get("/dashboard", authMiddleware, getDashboardData);
router.get("/:id", authMiddleware, getMeetingById);

export default router;





// const express = require("express");
// const router = express.Router();
// const Meeting = require("../models/Meeting");

// // CREATE
// router.post("/create", async (req, res) => {
//   try {
//     const { title } = req.body;

//     const roomCode = Math.random().toString(36).substring(2, 8);

//     const meeting = await Meeting.create({
//       title,
//       roomCode,
//       participants: []
//     });

//     res.json(meeting);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // JOIN
// router.post("/join", async (req, res) => {
//   try {
//     const { roomCode, userName } = req.body;

//     const meeting = await Meeting.findOne({ roomCode });

//     if (!meeting) {
//       return res.status(404).json({
//         message: "Meeting not found"
//       });
//     }

//     meeting.participants.push(userName);
//     await meeting.save();

//     res.json(meeting);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // DASHBOARD
// router.get("/dashboard", async (req, res) => {
//   try {
//     const meetings = await Meeting.find();
//     res.json(meetings);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;