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
    async (_, __, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });
        
        if (!user) {
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
          // Link Google ID and verify user if they sign in via Google
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          user.isVerified = true;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
