import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  signup,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  updateProfileSchema,
} from "../validators/authValidators.js";
import upload from "../config/cloudinary.js";

const router = express.Router();

// Public endpoints
router.post("/signup", validateRequest(signupSchema, "body"), signup);
router.post("/login", validateRequest(loginSchema, "body"), login);
router.post("/refresh", validateRequest(refreshTokenSchema, "body"), refreshAccessToken);

// Protected endpoints
router.post("/logout", validateRequest(logoutSchema, "body"), logout);
router.get("/me", authMiddleware, getMe);
router.put(
  "/update",
  authMiddleware,
  validateRequest(updateProfileSchema, "body"),
  upload.single("avatar"),
  updateProfile
);

export default router;