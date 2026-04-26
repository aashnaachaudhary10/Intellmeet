import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
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
    status: {
      type: String,
      enum: ["scheduled", "active", "ended"],
      default: "scheduled",
    },
    startedAt: Date,
    endedAt: Date,
    duration: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: String,
      default: "",
    },
    recordingFolder: {
      type: String,
      default: "",
    },
    recordingParts: [
      {
        key: String,
        url: String,
        name: String,
        size: Number,
        partNumber: Number,
        uploadedBy: String,
        uploadedByName: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        transcribed: {
          type: Boolean,
          default: false,
        },
        transcript: {
          type: String,
          default: "",
        },
      },
    ],
    summary: {
      type: String,
      default: "",
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    actionItems: [
      {
        task: { type: String, required: true },
        assignee: { type: String, default: "Unassigned" },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    chatMessages: [
      {
        sender: String,
        senderName: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);
