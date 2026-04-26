import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAnalytics, summarizeText } from "../controllers/aicontroller.js";

const router = express.Router();

router.post("/summarize", authMiddleware, summarizeText);
router.get("/analytics", authMiddleware, getAnalytics);

export default router;
