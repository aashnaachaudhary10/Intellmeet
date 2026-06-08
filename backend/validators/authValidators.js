import { z } from "zod";

// Password validation: min 8 chars, must have uppercase, lowercase, number
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Signup validation
export const signupSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: passwordSchema,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Update profile validation
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
});

// Logout validation
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Meeting validations
export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  scheduledTime: z.string().optional(),
});

export const joinMeetingSchema = z.object({
  meetingCode: z.string().min(6, "Meeting code must be at least 6 characters"),
  userName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

// Task validations
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  status: z.enum(["todo", "inprogress", "done"]).optional(),
  meetingId: z.string().optional(),
  assigneeName: z.string().max(255).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  status: z.enum(["todo", "inprogress", "done"]).optional(),
  assigneeName: z.string().max(255).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["todo", "inprogress", "done"], {
    errorMap: () => ({ message: "Status must be todo, inprogress, or done" })
  }),
});
