import Meeting from "../models/Meeting.js";
import User from "../models/user.js";

const calculateDurationMinutes = (startedAt, endedAt = new Date()) => {
  if (!startedAt) return 0;
  return Math.max(1, Math.round((new Date(endedAt) - new Date(startedAt)) / 60000));
};

//  Create Meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledTime } = req.body;
    
    // Auto-generate meeting code
    const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const currentUser = req.user?.id ? await User.findById(req.user.id).select("name") : null;
    const host = currentUser?.name || "Host";

    const newMeeting = new Meeting({
      title: title || "New Meeting",
      description,
      host,
      meetingCode,
      participants: [host],
      recordingFolder: `meeting-${meetingCode}`,
      startedAt: scheduledTime ? undefined : new Date(),
      status: scheduledTime ? "scheduled" : "active",
    });

    await newMeeting.save();

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting: newMeeting,
    });
  } catch (err) {
    console.error("Create Meeting Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    meeting.status = "active";
    if (!meeting.startedAt) meeting.startedAt = new Date();
    await meeting.save();

    res.status(200).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    meeting.status = "ended";
    meeting.endedAt = new Date();
    meeting.duration = calculateDurationMinutes(meeting.startedAt, meeting.endedAt);
    await meeting.save();

    res.status(200).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { transcript: transcript || "" },
      { new: true }
    );

    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });
    res.status(200).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveSummary = async (req, res) => {
  try {
    const { summary, keyPoints = [], actionItems = [] } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { summary: summary || "", keyPoints, actionItems },
      { new: true, runValidators: true }
    );

    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });
    res.status(200).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveRecordingPart = async (req, res) => {
  try {
    const { key, url, name, size, partNumber, uploadedBy, uploadedByName, folder } = req.body;
    
    const existing = await Meeting.findOne({
      _id: req.params.id,
      "recordingParts.partNumber": partNumber
    });

    if (existing) {
      return res.status(200).json({ success: true, meeting: existing });
    }

    const meeting = await Meeting.findByIdAndUpdate(req.params.id, {
      $set: { recordingFolder: folder },
      $push: {
        recordingParts: {
          key,
          url,
          name,
          size,
          partNumber,
          uploadedBy,
          uploadedByName,
        },
      },
    }, { new: true });

    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });
    res.status(200).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  Join Meeting
export const joinMeeting = async (req, res) => {
  try {
    const { meetingCode, meetingId, userName } = req.body;
    
    // Look up by meetingCode first, otherwise fallback to meetingId if needed
    const codeToSearch = meetingCode || meetingId;
    const meeting = await Meeting.findOne({ meetingCode: codeToSearch });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    if (!meeting.participants.includes(userName)) {
      meeting.participants.push(userName);
      await meeting.save();
    }

    res.status(200).json({
      success: true,
      message: "Joined meeting successfully",
      meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//  Dashboard Data
export const getDashboardData = async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalMeetings: meetings.length,
      meetings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Meeting By ID
export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Invalid Meeting ID or Server Error",
    });
  }
};

//  Delete Meeting
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    await Meeting.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};




// const Meeting = require("../models/Meeting");

// // Create Meeting
// exports.createMeeting = async (req, res) => {
//   try {
//     const { title, host } = req.body;

//     const meetingCode = Math.random().toString(36).substring(2, 8);

//     const meeting = await Meeting.create({
//       title,
//       host,
//       meetingCode,
//       participants: [host],
//     });

//     res.status(201).json({
//       success: true,
//       message: "Meeting created successfully",
//       meeting,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Join Meeting
// exports.joinMeeting = async (req, res) => {
//   try {
//     const { meetingCode, userName } = req.body;

//     const meeting = await Meeting.findOne({ meetingCode });

//     if (!meeting) {
//       return res.status(404).json({
//         success: false,
//         message: "Meeting not found",
//       });
//     }

//     if (!meeting.participants.includes(userName)) {
//       meeting.participants.push(userName);
//       await meeting.save();
//     }

//     res.status(200).json({
//       success: true,
//       message: "Joined successfully",
//       meeting,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Delete Meeting
// exports.deleteMeeting = async (req, res) => {
//   try {
//     const { id } = req.params;

//     await Meeting.findByIdAndDelete(id);

//     res.status(200).json({
//       success: true,
//       message: "Meeting deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Dashboard API
// exports.getDashboardData = async (req, res) => {
//   try {
//     const meetings = await Meeting.find().sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       totalMeetings: meetings.length,
//       meetings,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
