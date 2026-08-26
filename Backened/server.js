import "./env.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import PDFDocument from "pdfkit";
import { ConnectDB } from "./DB/ConnectDB.js";
import passport from "passport";
import "./config/passport.js";
import http from "http";
import { Server } from "socket.io";
import { analyzeVideoTranscript, summarizeVideoTranscript, getIncrementalQuizzes } from "./Controllers/AIController.js";
import { resumeUnfinishedQuizJobs } from "./services/quizGenerator.js";

// Route imports
import companyRoutes from "./check-your-ability/routes/companyRoutes.js";
import interviewRoutes from "./check-your-ability/routes/interviewRoutes.js";
import faceRoutes from "./check-your-ability/routes/faceRoutes.js";
import Authroute from "./Routes/Authroute.js";
import interviewSessionRoutes from "./check-your-ability/routes/interviewSessionRoutes.js";
import userRoutes from "./Routes/userRoutes.js";

import notificationRoutes from "./Routes/notificationRoutes.js";


import verifyPayment from "./Routes/paymentRoute.js";
import promoCodeRoutes from "./Routes/promoCodeRoute.js";

import chatRoutes from "./Routes/chatRoutes.js";
import ticketRoutes from "./Routes/ticketRoutes.js";
import aiRoutes from "./Routes/aiRoutes.js";
import projectSubmissionRoutes from "./Routes/ProjectSubmission.route.js";
import revenueRoutes from "./Routes/revenueRoutes.js";
import employeeRoutes from "./Routes/employeeRoutes.js";
import adminAuthRoutes from "./Routes/adminAuth.js";
import courseRequest from "./Routes/courseRequest.route.js"
import questionRoutes from "./Routes/questionRoutes.js";

const nervousCaptures = new Map();
import fs from "fs";




const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "https://prepvioai.com,https://www.prepvioai.com,https://prepvio-main-frontend-892382638275.europe-west1.run.app,http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// --- 1. CORS Configuration ---
// Explicit preflight handler — ensures Cloud Run / proxies don't swallow OPTIONS
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
      res.set("Access-Control-Allow-Credentials", "true");
      res.set("Access-Control-Max-Age", "86400");
    }
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400
}));

// --- 2. Middleware ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use("/api/interview-session", interviewSessionRoutes);
app.use(passport.initialize());
app.use("/api/payment", verifyPayment);
app.use("/api/chat", chatRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ai", aiRoutes);
app.post("/analyze", analyzeVideoTranscript);
app.post("/summary", summarizeVideoTranscript);
app.post("/api/ai/analyze", analyzeVideoTranscript);
app.post("/api/ai/summary", summarizeVideoTranscript);
app.get("/quizzes/:videoId", getIncrementalQuizzes);
app.get("/api/quizzes/:videoId", getIncrementalQuizzes);
app.get("/api/ai/quizzes/:videoId", getIncrementalQuizzes);
app.use("/api/project-submissions", projectSubmissionRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminAuthRoutes);

// Attach socket.io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- 3. MongoDB Connection ---
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB Connected");
      resumeUnfinishedQuizJobs().catch(err => {
        console.error("[Quiz Pipeline] Failed to check/resume unfinished quiz jobs:", err);
      });
    })
    .catch((err) => console.error("❌ MongoDB Error:", err));
} else {
  console.warn("⚠️ MONGO_URI is not set. Database connection skipped.");
}

// --- 4. Cloudflare R2 Configuration ---
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// --- 5. PDF Generation & Upload Route ---
app.post("/api/upload", async (req, res) => {
  try {
    const {
      filename,
      content,
      role,
      companyType,
      solvedProblems = [],
      sessionId, // REQUIRED
    } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "Filename and content required." });
    }

    const sanitizedFilename = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;

    const uniqueFilename = `interviews/${Date.now()}-${sanitizedFilename}`;

    // ✅ FETCH NERVOUS DATA FROM MEMORY
    let nervousData = null;
    if (sessionId && nervousCaptures.has(sessionId)) {
      nervousData = nervousCaptures.get(sessionId);
    }

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
      const chunks = [];

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;
      const userIndent = 200;

      /* ================= HEADER ================= */
      doc.fillColor("#1E40AF").rect(0, 0, pageWidth, 80).fill();
      doc.fillColor("#FFFFFF")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Mock Interview Report", margin, 25);

      doc.fontSize(11)
        .font("Helvetica")
        .text(
          `Role: ${role || "N/A"}  •  Company Type: ${companyType || "N/A"
          }  •  Date: ${new Date().toLocaleDateString()}`,
          margin,
          55
        );

      doc.moveDown(4);

      /* ================= CONVERSATION LOG ================= */
      doc.fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Conversation Log");

      doc.moveDown(1);

      const lines = content.split("\n");
      let nervousSectionRendered = false;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
          doc.moveDown(0.5);
          continue;
        }

        /* ===== INSERT NERVOUS SECTION BEFORE FINAL ANALYSIS ===== */
        if (trimmed === "=== FINAL ANALYSIS ===" && !nervousSectionRendered) {
          nervousSectionRendered = true;

          if (nervousData?.imageBase64) {
            doc.addPage();

            doc.font("Helvetica-Bold")
              .fontSize(16)
              .fillColor("#111827")
              .text("Behavioral Observation (Nervousness Detection)");

            doc.moveDown(1);

            doc.font("Helvetica")
              .fontSize(11)
              .fillColor("#374151")
              .text(
                "During the interview, moments of elevated nervousness were detected based on facial micro-movements, eye blink patterns, head pose variations, and lip movements.",
                { width: contentWidth }
              );

            doc.moveDown(0.8);

            if (typeof nervousData.score === "number") {
              doc.font("Helvetica-Bold")
                .fillColor("#92400E")
                .text(
                  `Peak Nervousness Score: ${nervousData.score.toFixed(2)} / 1.00`
                );
              doc.moveDown(0.6);
            }

            // ✅ FIX: Convert base64 to Buffer and embed directly
            try {
              // Remove data URL prefix if present
              const base64Data = nervousData.imageBase64.replace(/^data:image\/\w+;base64,/, '');

              // Convert base64 to Buffer
              const imageBuffer = Buffer.from(base64Data, 'base64');

              // Embed image directly in PDF
              doc.image(imageBuffer, {
                fit: [400, 300],
                align: "center",
              });

              console.log("✅ Nervousness image added to PDF from base64");
            } catch (imgErr) {
              console.error("❌ Error embedding nervousness image:", imgErr.message);
              doc.font("Helvetica-Oblique")
                .fontSize(10)
                .fillColor("#6B7280")
                .text("Nervousness image unavailable (embedding error).");
            }

            doc.moveDown(1);

            doc.font("Helvetica-Oblique")
              .fontSize(10)
              .fillColor("#6B7280")
              .text(
                "Note: Nervousness during interviews is common and does not negatively reflect technical ability. This data is for self-improvement only.",
                { width: contentWidth }
              );
          } else {
            console.log("ℹ️ No nervousness data captured during this interview");
          }
        }

        /* ===== FINAL ANALYSIS HEADER ===== */
        if (trimmed === "=== FINAL ANALYSIS ===") {
          doc.fillColor("#059669")
            .font("Helvetica-Bold")
            .fontSize(18)
            .text("Performance Analysis & Recommendations");
          doc.moveDown(1);
          continue;
        }

        /* ===== CHAT MESSAGES ===== */
        if (trimmed.startsWith("AI:") || trimmed.startsWith("Assistant:")) {
          doc.fillColor("#1E40AF")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("AI Interviewer:", { continued: true });

          doc.fillColor("#111827")
            .font("Helvetica")
            .text(
              trimmed.replace(/^(AI:|Assistant:)\s*/i, ""),
              { width: contentWidth }
            );

          doc.moveDown(0.5);
          continue;
        }

        if (trimmed.startsWith("User:")) {
          doc.x = margin + userIndent;
          doc.fillColor("#059669")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("You:", { continued: true });

          doc.fillColor("#111827")
            .font("Helvetica")
            .text(trimmed.replace(/^User:\s*/i, ""), {
              width: contentWidth - userIndent,
            });

          doc.x = margin;
          doc.moveDown(0.5);
          continue;
        }

        doc.fillColor("#374151")
          .font("Helvetica")
          .fontSize(11)
          .text(trimmed, { width: contentWidth });

        doc.moveDown(0.3);
      }

      doc.end();
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    // ✅ CLEANUP SESSION MEMORY

    console.log("UPLOAD sessionId:", sessionId);
    console.log("AVAILABLE sessions:", [...nervousCaptures.keys()]);

    if (sessionId) nervousCaptures.delete(sessionId);

    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFilename}`;
    res.json({ success: true, publicUrl });
  } catch (err) {
    console.error("PDF Upload Error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

app.post("/api/nervous-frame", (req, res) => {
  const { sessionId, imageBase64, score } = req.body;

  if (!sessionId || !imageBase64) {
    return res.status(400).json({ error: "Missing sessionId or imageBase64" });
  }

  const existing = nervousCaptures.get(sessionId);

  // Only store if this is the highest score for this session
  if (!existing || score > existing.score) {
    nervousCaptures.set(sessionId, {
      imageBase64,  // Store base64 string
      score,
      timestamp: new Date().toISOString(),
    });

    console.log(`🟡 Stored nervous frame (base64) for session: ${sessionId}, score: ${score.toFixed(2)}`);
  }

  res.json({ success: true });
});

app.use("/api/course-request", courseRequest)


// --- 6. Code Execution Route (Piston API) ---
app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version: "*",
      files: [{ content: code }],
      stdin: input || "",
    });

    res.json(response.data);
  } catch (err) {
    console.error("❌ Piston API Error:", err.message);
    res.status(500).json({ error: "Error executing code" });
  }
});

// --- 7. Routes for Companies, Interviews, and Auth ---
app.use("/api/auth", Authroute);
app.use("/api/companies", companyRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/promo", promoCodeRoutes);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler caught an error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});


// github recommiting

// --- 8. Health checks ---
app.get("/", (req, res) => {
  res.send("🚀 Virtual Interview Backend Running Successfully!");
});
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

import { VoicePipeline } from "./check-your-ability/services/voiceStreamService.js";

// --- 9. Create HTTP Server & Socket.IO ---
let io;
let server;

const initializeSocketServer = () => {
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // Initialize AI Voice Pipeline for this connection
    const voicePipeline = new VoicePipeline(socket);

    socket.emit("HELLO", "Socket connection successful");

    let userId = socket.handshake.auth?.userId;

    if (userId) {
      socket.join(userId.toString());
      socket.join(`conv_${userId}`);
      console.log("🔌 User joined rooms:", userId, `conv_${userId}`);
    } else {
      const token = socket.handshake.auth?.token;
      if (token) {
        try {
          const jwt = require("jsonwebtoken");
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "mydevsecret");
          if (decoded && decoded.id) {
            userId = decoded.id;
            socket.join(userId.toString());
            console.log("🔌 User authenticated via token, joined room:", userId);
          }
        } catch (error) {
          console.error("Token verification failed:", error.message);
        }
      } else {
        console.log("⚠️ Socket connected without authentication (allowed for now)");
      }
    }

    socket.on("join_conversation", ({ userId }) => {
      if (userId) {
        socket.join(`conv_${userId}`);
        console.log(`🔌 Socket ${socket.id} joined conversation room: conv_${userId}`);
      }
    });

    // 🎤 Handle incoming raw audio stream from the browser
    socket.on("audio_chunk", (chunk) => {
      voicePipeline.processAudioInput(chunk);
    });

    socket.on("trigger_tts", (text) => {
      voicePipeline.processTTSRequest(text);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
      voicePipeline.cleanup();
    });
  });

  return server;
};

// 🔥 EXPORT io FOR NOTIFICATION SERVICE
export { io };

// --- 11. Start Server ---
const PORT = Number(process.env.PORT || 8080);

const startServer = (port) => {
  const listener = initializeSocketServer().listen(port, "0.0.0.0", () => {
    ConnectDB();
    console.log(`🚀 Server running on port ${port}`);
    console.log("✅ MongoDB Connected via ConnectDB()");
    if (process.env.R2_BUCKET_NAME) {
      console.log(`📁 R2 Bucket: ${process.env.R2_BUCKET_NAME}`);
    }
  });

  listener.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error("❌ Server startup error:", error);
    process.exit(1);
  });
};

startServer(PORT);
