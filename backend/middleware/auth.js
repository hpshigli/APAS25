// backend/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate either a normal user or an admin.
 * Use 'Authorization: Bearer <token>' or custom headers:
 *   token   → for normal users
 *   adToken → for admins
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Try to extract from multiple possible header names
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    // Support legacy/custom header names
    const userToken = req.headers.token || bearerToken;
    const adminToken = req.headers.adtoken || req.headers["x-ad-token"];

    // Decide which token to check
    const token = adminToken || userToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized — please login again" });
    }

    // Decide which secret to verify against
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        adminToken ? process.env.JWT_SECRET_1 : process.env.JWT_SECRET
      );
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // Store user/admin ID in request for controllers to use
    req.userId = decoded.id;
    req.isAdmin = Boolean(adminToken);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Auth check failed" });
  }
};

export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const adminToken = req.headers.adtoken || req.headers["x-ad-token"] || bearer;
  if (!adminToken) {
    return res.status(401).json({ success: false, message: "Admin token required" });
  }
  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET_1);
    req.userId = decoded.id;
    req.isAdmin = true;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
};

export default authMiddleware;
