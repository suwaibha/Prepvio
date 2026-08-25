import { User } from "../Models/User.js";
import { Project } from "../Models/Project.js"; // Added this import
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { generateTokenAndSetCookie } from "../Utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emailsent.js";
import { sendWelcomeNotification, sendFreeInterviewCreditNotification } from "../Utils/notificationHelper.js";
import { deduplicateCourseProgress } from "../Utils/courseHelper.js";

export const checkAuth = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(200).json({ success: true, user: null });
    }

    // ✅ Handle Hardcoded Admin Session
    if (req.userId === "admin") {
      return res.status(200).json({
        success: true,
        user: {
          _id: "admin",
          email: process.env.ADMIN_EMAIL,
          name: "Admin",
          isAdmin: true,
          role: "admin"
        }
      });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(200).json({ success: true, user: null });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth", error);
    res.status(200).json({ success: false, user: null });
  }
};


/* ================= SIGNUP ================= */
export const signup = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");
  let newUser;

  try {
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const userAlreadyExist = await User.findOne({ email });
    if (userAlreadyExist) {
      if (!userAlreadyExist.isVerified) {
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        userAlreadyExist.verificationToken = verificationToken;
        userAlreadyExist.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await userAlreadyExist.save();
        await sendVerificationEmail(userAlreadyExist.email, verificationToken);

        return res.status(200).json({
          success: true,
          message: "A new verification code has been sent to your email.",
        });
      }

      return res.status(400).json({ success: false, message: "user already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    newUser = new User({
      email,
      password: hashedPassword,
      name,
      // Public registration must never use a client-provided role.
      role: "user",
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await newUser.save();

    // ✅ DO NOT LOGIN USER HERE
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created. Please verify your email.",
    });
  } catch (error) {
    console.error("Signup failed:", error.message);

    if (newUser?._id && !newUser.isVerified) {
      return res.status(503).json({
        success: false,
        message: "Account created, but the verification email could not be sent. Check SMTP settings and sign up again to resend the code.",
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= VERIFY EMAIL ================= */
export const verifyEmail = async (req, res) => {
  const trimmedCode = String(req.body.code).trim();

  try {
    const user = await User.findOne({
      verificationToken: trimmedCode,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // ✅ LOGIN USER ONLY AFTER VERIFICATION
    const token = generateTokenAndSetCookie(res, user._id, "user_token");

    await sendWelcomeEmail(user.email, user.name);

    // ✅ SEND WELCOME NOTIFICATION
    await sendWelcomeNotification(user._id, user.name);

    // ✅ SEND FREE INTERVIEW CREDIT NOTIFICATION (with delay)
    setTimeout(async () => {
      await sendFreeInterviewCreditNotification(user._id, user.name);
    }, 2000);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token: token,  // ✅ Return token to frontend for socket connection
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error in verifyEmail", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/User ID and password are required"
      });
    }

    // 1. Try to find user in DB (by Email OR UserID)
    console.log("--------------- LOGIN DEBUG ---------------");
    console.log("Input Email/ID:", email);

    // Assuming User model has a userId field, if not, you might need to check if email is also userId or adjust query
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { userId: email }]
    }).select("+password");

    console.log("DB User Found:", user ? `Yes (${user.email})` : "No");

    // 2. If user found in DB, verify password
    if (user) {
      if (user.authProvider === "google") {
        return res.status(400).json({
          success: false,
          message: "This account uses Google sign-in",
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before signing in.",
        });
      }

      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (isPasswordValid) {
        console.log("Password valid. User Role:", user.role);

        // ❌ BLOCK ADMINS FROM LOGGING IN HERE
        if (user.role === "admin" || user.role === "superadmin") {
          console.log("⛔ Blocking Admin from User Portal");
          return res.status(403).json({
            success: false,
            message: "Admins must login via the Admin Portal (port 5174)",
          });
        }

        // Regular User Login
        const token = generateTokenAndSetCookie(res, user._id, "user_token");
        const isFirstLogin = !user.lastLogin;

        user.lastLogin = new Date();
        await user.save();

        if (isFirstLogin) {
          await sendWelcomeNotification(user._id, user.name);
          setTimeout(async () => {
            await sendFreeInterviewCreditNotification(user._id, user.name);
          }, 2000);
        }

        return res.status(200).json({
          success: true,
          message: "Logged in successfully",
          token: token,
          user: { ...user._doc, password: undefined },
        });
      }
    }

    // 3. FALLBACK: Check Hardcoded Admin (if DB login failed or user not found)
    // ❌ BLOCK HARDCODED ADMIN FROM USER PORTAL
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      return res.status(403).json({
        success: false,
        message: "Admins must login via the Admin Portal (port 5174)"
      });
    }

    return res.status(400).json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

/* ================= FORGOT / RESET PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000;

    await user.save();
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    user.password = await bcryptjs.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.clearCookie("token", cookieOptions);
  res.clearCookie("user_token", cookieOptions);
  res.clearCookie("admin_token", cookieOptions);
  res.clearCookie("user_auth_token", cookieOptions);
  res.clearCookie("admin_auth_token", cookieOptions);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user; // injected by passport

    // Issue SAME JWT as normal users
    const token = generateTokenAndSetCookie(res, user._id, "user_token");
    // Check if this is a new user (from passport) or first login
    const isFirstLogin = user.isNewUser || !user.lastLogin;

    user.lastLogin = new Date();
    await user.save();

    // ✅ SEND WELCOME NOTIFICATION FOR NEW GOOGLE USERS
    if (isFirstLogin) {
      await sendWelcomeNotification(user._id, user.name);

      // ✅ SEND FREE INTERVIEW CREDIT NOTIFICATION (with delay)
      setTimeout(async () => {
        await sendFreeInterviewCreditNotification(user._id, user.name);
      }, 2000);
    }

    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  } catch (error) {
    console.error("Google auth error:", error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

/* ================= NEW PORTFOLIO LOGIC ================= */

// GET ALL PORTFOLIO DATA
export const getPortfolioData = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const projects = await Project.find({ userId: req.userId });

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        location: user.location,
      },
      skills: deduplicateCourseProgress(user.courseProgress || []),
      interviews: user.interviewAttempts || [],
      aptitude: user.aptitudeAttempts || [],
      projects: projects || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD NEW PROJECT
export const addProject = async (req, res) => {
  try {
    const { title, description, tags, imageUrl, liveLink, githubLink } = req.body;
    const newProject = new Project({
      userId: req.userId,
      title,
      description,
      tags,
      imageUrl,
      liveLink,
      githubLink
    });
    await newProject.save();
    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

