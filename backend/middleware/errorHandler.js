import { sendError, formatValidationErrors } from "../utils/response.js";
import { ZodError } from "zod";

// Error handler middleware
export const errorHandler = (error, req, res, next) => {
  console.error("Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const errors = formatValidationErrors(error);
    return sendError(res, 422, "Validation failed", errors);
  }

  // Prisma errors
  if (error.code === "P2025") {
    return sendError(res, 404, "Resource not found");
  }

  if (error.code === "P2002") {
    const field = error.meta?.target?.[0] || "field";
    return sendError(res, 409, `${field} already exists`);
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return sendError(res, 401, "Invalid token");
  }

  if (error.name === "TokenExpiredError") {
    return sendError(res, 401, "Token expired");
  }

  // Generic errors
  return sendError(res, 500, error.message || "Internal server error");
};

export default errorHandler;
