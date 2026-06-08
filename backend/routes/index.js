import { Router } from "express";
import authRoutes from "./auth.js";
import meetingRoutes from "./meetingRoutes.js";
import aiRoutes from "./ai.js";
import taskRoutes from "./taskRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/ai", aiRoutes);
router.use("/tasks", taskRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
