import jwt from "jsonwebtoken";
import { User } from "../Models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // 1️⃣ CHECK AUTHORIZATION HEADER (Highest priority for cross-port isolation)
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ CHECK COOKIES (Fallback)
    if (!token) {
      token = req.cookies?.token || req.cookies?.user_token || req.cookies?.admin_token || req.cookies?.user_auth_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mydevsecret");

    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token",
      });
    }

    // 3️⃣ HANDLE HARDCODED ADMIN
    if (userId === "admin" || userId === "admin-fallback") {
      req.user = {
        _id: "admin",
        id: "admin",
        email: process.env.ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        isAdmin: true
      };
      req.userId = "admin";
      return next();
    }

    // 4️⃣ FETCH USER FROM DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found",
      });
    }

    req.user = user;
    req.userId = user._id; // Set for consistency across different middlewares
    next();
  } catch (error) {
    console.error("verifyToken error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const isAdmin = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();

  if (userRole === 'admin' || userRole === 'superadmin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access only.'
    });
  }
};

export const authenticate = verifyToken;
