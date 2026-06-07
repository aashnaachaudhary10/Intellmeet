import { verifyAccessToken, getTokenFromHeader } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

const authMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      return sendError(res, 401, "No token provided");
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return sendError(res, 401, "Invalid or expired token");
    }

    req.user = { ...decoded, id: decoded.id };
    next();
  } catch (error) {
    return sendError(res, 401, "Authentication failed");
  }
};

export default authMiddleware;