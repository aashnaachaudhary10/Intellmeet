const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/Intellmeet";

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log(" Connected to MongoDB");
  } catch (err) {
    console.log(" DB Error:", err);
  }
}

main();

// Routes
const meetingRoutes = require("./routes/meetingRoutes");
app.use("/api/meetings", meetingRoutes);

// Test route
app.get("/", (req, res) => {
  res.send(" IntellMeet Backend is running");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// const MONGO_URL = "mongodb://127.0.0.1:27017/Intellmeet";

// async function main() {
//   await mongoose.connect(MONGO_URL);
//   console.log("Connected to DB");
// }

// main().catch((err) => console.log(err));

// const PORT = process.env.PORT || 5000;

// app.get('/', (req, res) => {
//     res.send('Backend is running');
// });

// app.listen(5173, () => {
//     console.log(`Server is running on port 5173`);
// });