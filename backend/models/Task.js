import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    status: { 
      type: String, 
      enum: ["todo", "in-progress", "done"], 
      default: "todo" 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    meetingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Meeting" 
    }
  }, 
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
