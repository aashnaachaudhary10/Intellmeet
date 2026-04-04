import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express(); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", limiter); 
app.use("/api/auth", authRoutes);

const PORT = 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log("DB Error:", err));
