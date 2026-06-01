import { z } from "zod";

// Password validation: min 8 chars, must have uppercase, lowercase, number
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Signup form validation
export const signupFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export type SignupFormInput = z.infer<typeof signupFormSchema>;

// Login form validation
export const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;

// Update profile validation
export const updateProfileFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  avatar: z.string().optional(),
});

export type UpdateProfileFormInput = z.infer<typeof updateProfileFormSchema>;
