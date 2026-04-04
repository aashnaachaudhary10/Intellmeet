import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { signup, login, getMe, updateProfile } from "../controllers/authController.js";
const router = express.Router();
router.get("/me", authMiddleware, getMe);
router.put("/update", authMiddleware, updateProfile);

router.post("/signup", signup);
router.post("/login", login);

export default router;