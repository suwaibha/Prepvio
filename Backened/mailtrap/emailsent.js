import nodemailer from "nodemailer";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

const mailUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || "";
const mailPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS || "";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

const isMailConfigured = Boolean(mailUser && mailPass);

if (isMailConfigured) {
  transporter.verify().then(() => {
    console.log("✅ SMTP server is ready to take messages");
  }).catch((error) => {
    console.warn("⚠️ SMTP verification failed, continuing without email delivery:", error.message);
  });
} else {
  console.warn("⚠️ SMTP credentials are not configured. Email sending is disabled until GMAIL_USER/GMAIL_PASS are set.");
}

// Helper function to send email
const sendEmail = async (to, subject, html) => {
  if (!isMailConfigured) {
    console.warn("⚠️ Skipping email send because SMTP credentials are not configured.");
    throw new Error("Email service is not configured. Set SMTP_USER and SMTP_PASS in the backend environment.");
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || mailUser,
    to,
    subject,
    html,
  });
};

// Send verification email
export const sendVerificationEmail = async (email, verificationToken) => {
  const htmlContent = VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken);

  try {
    const info = await sendEmail(email, "Verify your email", htmlContent);
    console.log("✅ Verification email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
};

// Send welcome email with HTML template
export const sendWelcomeEmail = async (email, name) => {
  const htmlContent = WELCOME_EMAIL_TEMPLATE.replace("{name}", name);

  try {
    const info = await sendEmail(email, "Welcome to Prepvio 🎉", htmlContent);
    console.log("✅ Welcome email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetURL) => {
  const htmlContent = PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL);

  try {
    const info = await sendEmail(email, "Reset your password", htmlContent);
    console.log("✅ Password reset email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
  }
};

// Send password reset success email
export const sendResetSuccessEmail = async (email) => {
  try {
    const info = await sendEmail(email, "Password Reset Successful", PASSWORD_RESET_SUCCESS_TEMPLATE);
    console.log("✅ Password reset success email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending password reset success email:", error);
  }
};
