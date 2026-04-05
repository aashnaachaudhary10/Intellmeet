import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express(); // ✅ FIRST create app

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});

app.use("/api/auth", limiter);
app.use("/api/auth", authRoutes);

// Create HTTP server
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);
  });

  socket.on("sendMessage", ({ roomId, message }) => {
    io.to(roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Connect DB + start server
const PORT = 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    server.listen(PORT, () => {  // ✅ ONLY THIS
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch(err => console.log("DB Error:", err));
