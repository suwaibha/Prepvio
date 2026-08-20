import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId, cookieName = "token") => {
  const secret = process.env.JWT_SECRET || "mydevsecret";
  const token = jwt.sign(
    { id: userId }, // ✅ MUST be `id`
    secret,
    { expiresIn: "7d" }
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};