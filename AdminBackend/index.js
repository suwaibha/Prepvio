import "./env.js";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { verifyToken } from './Server/middleware/verifyToken.js';
// import dotenv from 'dotenv';
import servicesRouter from './Server/routes/services.route.js';
import coursesRouter from './Server/routes/courses.route.js';
import channelsRouter from './Server/routes/channels.route.js';
import playlistsRouter from './Server/routes/playlists.route.js';
import quizzesRouter from './Server/routes/quizzes.route.js';
import videosRouter from './Server/routes/videos.route.js'; // ✅ Import videos route
import categoryRoutes from "./Server/routes/categories.route.js";
import dashboardRouter from "./Server/routes/dashboard.route.js";
import AptitudeRouter from './Server/routes/aptitude.route.js'
import projectsRouter from './Server/routes/projects.route.js'; // ✅ Import projects route
import submissionsRouter from './Server/routes/submissions.route.js'; // ✅ Import submissions route



const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "https://prepvioai.com,https://www.prepvioai.com,https://prepvio-main-frontend-892382638275.europe-west1.run.app,http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Database Connection
console.log('AdminBackend connecting to:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (Protected)
app.use('/api/services', verifyToken, servicesRouter);
app.use('/api/courses', verifyToken, coursesRouter);
app.use('/api/channels', verifyToken, channelsRouter);
app.use('/api/playlists', verifyToken, playlistsRouter);
app.use('/api/quizzes', verifyToken, quizzesRouter);
app.use('/api/videos', verifyToken, videosRouter);
app.use("/api/categories", verifyToken, categoryRoutes);
app.use("/api/dashboard", verifyToken, dashboardRouter);
app.use("/api/aptitude", verifyToken, AptitudeRouter);
app.use('/api/projects', verifyToken, projectsRouter); // ✅ Register projects route
app.use('/api/project-submissions', verifyToken, submissionsRouter); // ✅ Register submissions route

app.get("/", (req, res) => {
  res.send("Admin Backend is running");
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
