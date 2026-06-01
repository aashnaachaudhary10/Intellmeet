import { verifyAccessToken, getTokenFromHeader } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = getTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return sendError(res, 401, "No token provided");
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return sendError(res, 401, "Invalid or expired token");
    }

    // Set user in request object
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, "Authentication failed");
  }
};

export default authMiddleware;