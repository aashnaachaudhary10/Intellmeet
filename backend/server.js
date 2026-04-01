import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Intellmeet API is live and kicking!");
});

app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch(err => console.log(err));