const emailLayout = ({ title, eyebrow, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Prepvio</title>
</head>
<body style="margin:0; padding:0; background:#FDFBF9; color:#1A1A1A; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FDFBF9; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background:#FFFFFF; border:1px solid #E8E6E1; border-radius:24px; overflow:hidden;">
        <tr><td style="background:#1A1A1A; padding:28px 36px;">
          <p style="margin:0 0 8px; color:#D4F478; font-size:12px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase;">${eyebrow}</p>
          <h1 style="margin:0; color:#FFFFFF; font-size:30px; line-height:1.2;">${title}</h1>
        </td></tr>
        <tr><td style="padding:32px 36px; color:#454545; font-size:16px; line-height:1.65;">${content}</td></tr>
        <tr><td style="padding:0 36px 28px; color:#8A8A8A; font-size:12px; line-height:1.5;">This is an automated message from Prepvio. Please do not reply to this email.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const actionButton = (href, label) => `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto;"><tr><td style="border-radius:999px; background:#D4F478;"><a href="${href}" style="display:inline-block; padding:13px 24px; color:#1A1A1A; font-size:14px; font-weight:700; text-decoration:none;">${label}</a></td></tr></table>`;

export const VERIFICATION_EMAIL_TEMPLATE = emailLayout({
  title: "Verify your email",
  eyebrow: "Prepvio account security",
  content: `<p style="margin-top:0;">Welcome to Prepvio. Use the verification code below to finish setting up your account.</p>
    <div style="margin:28px 0; padding:20px; border-radius:16px; background:#F4F8E8; color:#1A1A1A; font-size:30px; font-weight:700; letter-spacing:8px; text-align:center;">{verificationCode}</div>
    <p>This code expires in 15 minutes. If you did not create a Prepvio account, you can safely ignore this email.</p>`,
});

export const PASSWORD_RESET_SUCCESS_TEMPLATE = emailLayout({
  title: "Password reset successful",
  eyebrow: "Prepvio account security",
  content: `<p style="margin-top:0;">Your Prepvio password has been reset successfully.</p><p>If you did not make this change, please contact support immediately and secure your account.</p>`,
});

export const PASSWORD_RESET_REQUEST_TEMPLATE = emailLayout({
  title: "Reset your password",
  eyebrow: "Prepvio account security",
  content: `<p style="margin-top:0;">We received a request to reset your Prepvio password. Use the button below to choose a new one.</p>${actionButton("{resetURL}", "Reset password")}<p>This link expires in one hour. If you did not request a reset, you can safely ignore this email.</p>`,
});

export const WELCOME_EMAIL_TEMPLATE = emailLayout({
  title: "Welcome to Prepvio, {name}",
  eyebrow: "Your preparation starts here",
  content: `<p style="margin-top:0;">We're glad you're here. Your Prepvio dashboard is ready for interview practice, guided learning, and progress tracking.</p>${actionButton(process.env.CLIENT_URL || "http://localhost:5173", "Go to dashboard")}<p>We're here to help you prepare with confidence.</p>`,
});
