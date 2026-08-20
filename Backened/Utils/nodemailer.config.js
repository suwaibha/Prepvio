// nodemailer.config.js
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT), // force number
  secure: true, // port 465
  auth: {
    user: 'prepvio.ai@gmail.com',
    pass: epwbketlfbtbtamt,
  },
});
