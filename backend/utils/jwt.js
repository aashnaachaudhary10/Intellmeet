import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

// Generate access token (short-lived)
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Extract user ID from token payload
export const getUserIdFromToken = (token) => {
  const decoded = verifyAccessToken(token);
  return decoded?.id || null;
};

// Get token from Authorization header
export const getTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
};
