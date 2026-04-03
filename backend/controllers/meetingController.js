const Meeting = require("../models/Meeting.js");

//  Create Meeting
module.exports.createMeeting = async (req, res) => {
  try {
    const { title, date, time, host } = req.body;

    const newMeeting = new Meeting({
      title,
      date,
      time,
      host,
    });

    await newMeeting.save();

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting: newMeeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//  Join Meeting
module.exports.joinMeeting = async (req, res) => {
  try {
    const { meetingId, userName } = req.body;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    meeting.participants.push(userName);
    await meeting.save();

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
module.exports.getDashboardData = async (req, res) => {
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

//  Delete Meeting
module.exports.deleteMeeting = async (req, res) => {
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