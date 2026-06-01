import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import fs from "fs";

// SIGNUP
export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError(res, 409, "Email already registered");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "member",
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || "",
      role: user.role,
    };

    return sendSuccess(res, 201, "User registered successfully", {
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);
    next(error);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || "",
      role: user.role,
    };

    return sendSuccess(res, 200, "Login successful", {
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

// REFRESH TOKEN
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, "Refresh token is required");
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return sendError(res, 401, "Invalid refresh token");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      return sendError(res, 401, "Refresh token expired or invalid");
    }

    const newAccessToken = generateAccessToken(decoded.id);

    return sendSuccess(res, 200, "Token refreshed successfully", {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// LOGOUT
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, "Refresh token is required");
    }

    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });

    return sendSuccess(res, 200, "Logout successful");
  } catch (error) {
    next(error);
  }
};

// GET CURRENT USER
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "User retrieved successfully", { user });
  } catch (error) {
    next(error);
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const name = req.body.name;
    let avatarUrl = req.body.avatar;

    if (req.file) {
      try {
        avatarUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      } catch (uploadError) {
        console.error('Avatar upload failed:', uploadError);
        return sendError(res, 500, 'Failed to upload avatar');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, 200, "Profile updated successfully", {
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
