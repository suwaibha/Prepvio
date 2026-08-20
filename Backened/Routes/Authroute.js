import express from "express";
import passport from "passport";
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
  googleAuthCallback,
} from "../Controllers/Authcontrollers.js";
import { verifyToken } from "../middleware/verifytoken.js";



const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);

router.post("/verify-email",verifyEmail);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ================= GOOGLE AUTH =================

// Step 1: Redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Step 2: Google redirects back here
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  googleAuthCallback
);

export default router;