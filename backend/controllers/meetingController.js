import Meeting from "../models/Meeting.js";

//  Create Meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledTime } = req.body;
    
    // Auto-generate meeting code
    const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Determine host from JWT middleware
    const host = req.user?.name || "Host";

    const newMeeting = new Meeting({
      title: title || "New Meeting",
      description,
      date: scheduledTime || new Date(),
      time: scheduledTime || new Date(),
      host,
      meetingCode,
      participants: [host],
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