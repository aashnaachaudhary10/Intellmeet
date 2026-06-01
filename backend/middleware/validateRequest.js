import { ZodError } from "zod";
import { sendError, formatValidationErrors } from "../utils/response.js";

// Validation middleware factory
export const validateRequest = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const dataToValidate =
        source === "body"
          ? req.body
          : source === "params"
            ? req.params
            : req.query;

      const validatedData = schema.parse(dataToValidate);

      // Attach validated data to request
      if (source === "body") {
        req.body = validatedData;
      } else if (source === "params") {
        req.params = validatedData;
      } else {
        req.query = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatValidationErrors(error);
        return sendError(res, 422, "Validation failed", errors);
      }
      return sendError(res, 500, "Validation error");
    }
  };
};

export default validateRequest;
