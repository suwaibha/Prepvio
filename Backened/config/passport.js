import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { User } from "../Models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("[Google OAuth] Strategy callback triggered. Profile:", JSON.stringify(profile));
        
        if (!profile.emails || profile.emails.length === 0) {
          throw new Error("No email address returned from Google profile");
        }
        
        const email = profile.emails[0].value;
        console.log("[Google OAuth] Authenticating email:", email);

        let user = await User.findOne({ email });
        
        if (!user) {
          console.log("[Google OAuth] Creating new user for:", email);
          user = await User.create({
            name: profile.displayName,
            email,
            isVerified: true,
            authProvider: "google",
            googleId: profile.id,
            password: crypto.randomBytes(32).toString("hex"), // dummy
          });
          user.isNewUser = true; // ✅ Mark as new user for welcome notification
        } else {
          console.log("[Google OAuth] Found existing user for:", email);
          // Link Google ID and verify user if they sign in via Google
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          user.isVerified = true;
          await user.save();
        }

        console.log("[Google OAuth] Authentication successful for:", email);
        return done(null, user);
      } catch (err) {
        console.error("[Google OAuth] Strategy error:", err);
        return done(err, null);
      }
    }
  )
);
