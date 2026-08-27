import jwt from "jsonwebtoken";
import { User } from "../Models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ CHECK HEADER FIRST (Priority for Admin/API calls)
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ STRICT PORT-BINDING FOR COOKIES
    const origin = req.headers.origin || req.headers.referer || "";
    const isAdminApp = origin.includes(":5174");
    const isUserApp = origin.includes(":5173");

    if (!token) {
      if (isAdminApp) {
        // Port 5174: Prioritize admin_token
        token = req.cookies?.admin_token;
      } else if (isUserApp) {
        // Port 5173: Prioritize user_token
        token = req.cookies?.user_token;
      } else {
        // Generic fallback: Try both but be explicit
        token = req.cookies?.user_token || req.cookies?.admin_token || req.cookies?.token;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token provided",
      });
    }

    // JWT_SECRET should be set in .env. If missing in production, it is a critical misconfiguration.
    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH] CRITICAL: JWT_SECRET is not set. Refusing to authenticate in production.');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }
      console.warn('[AUTH] WARNING: JWT_SECRET not set in environment — using dev fallback. Set JWT_SECRET in .env');
    }
    const secret = process.env.JWT_SECRET || 'mydevsecret';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token",
      });
    }

    // ✅ ADMIN BYPASS: If it's the admin user, skip database lookup
    if ((userId === "admin" || userId === "admin-fallback") && (decoded.isAdmin || decoded.role === 'admin')) {
      req.userId = "admin";
      req.isAdmin = true;
      return next();
    }

    const user = await User.findById(userId).select("_id");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found",
      });
    }

    req.userId = user._id; // ✅ Set req.userId for consistency
    next();
  } catch (error) {
    console.error("verifyToken error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const verifyTokenOptional = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ CHECK HEADER FIRST
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ STRICT PORT-BINDING FOR COOKIES
    const origin = req.headers.origin || req.headers.referer || "";
    const isAdminApp = origin.includes(":5174");
    const isUserApp = origin.includes(":5173");

    if (!token) {
      if (isAdminApp) {
        token = req.cookies?.admin_token;
      } else if (isUserApp) {
        token = req.cookies?.user_token;
      } else {
        token = req.cookies?.user_token || req.cookies?.admin_token || req.cookies?.token;
      }
    }

    if (!token) {
      return next(); // Proceed without req.userId
    }

    const secret = process.env.JWT_SECRET || "mydevsecret";
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return next();
    }

    if ((userId === "admin" || userId === "admin-fallback") && (decoded.isAdmin || decoded.role === 'admin')) {
      req.userId = "admin";
      req.isAdmin = true;
      return next();
    }

    const user = await User.findById(userId).select("_id");
    if (user) {
      req.userId = user._id;
    }
    next();
  } catch (error) {
    console.error("verifyTokenOptional error:", error.message);
    next(); // Fallback to guest submission rather than failing
  }
};

