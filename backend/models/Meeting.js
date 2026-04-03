const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    meetingCode: {
      type: String,
      required: true,
      unique: true,
    },
    host: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);