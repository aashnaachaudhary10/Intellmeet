import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";

import router from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";

dotenv.config();

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Rate limiter on auth endpoints only
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later",
});
app.use("/api/auth", limiter);

// Routes
app.use("/api", router);

// HTTP + Socket.IO server
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN, credentials: true },
});

registerSocketHandlers(io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL (Neon)`);
});
