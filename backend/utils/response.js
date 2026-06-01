// Standardized error response format
export const sendError = (res, status, message, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

// Standardized success response format
export const sendSuccess = (res, status = 200, message = "Success", data = null) => {
  return res.status(status).json({
    success: true,
    message,
    ...(data && { data }),
  });
};

// Format Zod validation errors
export const formatValidationErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const field = error.path.join(".");
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(error.message);
  });
  return errors;
};
