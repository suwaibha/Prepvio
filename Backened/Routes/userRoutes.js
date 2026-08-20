import express from "express";
import { User } from "../Models/User.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { sendCourseStartedNotification, sendCourseCompletedNotification } from "../Utils/notificationHelper.js";
import { deduplicateCourseProgress } from "../Utils/courseHelper.js";
import { getTranscript } from "../services/transcript.js";
import { generateSummary } from "../services/summaryGenerator.js";
import VideoSummary from "../Models/VideoSummary.js";
import PDFDocument from "pdfkit";
import { mergeTranscript } from "../Utils/mergeTranscript.js";
import { detectTopics } from "../services/topicDetector.js";
import { generateQuizzes } from "../services/quizGenerator.js";
import { processVideoQuizzesInBackground } from "../services/videoProcessingPipeline.js";
import { CacheManager } from "../services/cacheManager.js";
import { sliceAllTopics } from "../Utils/sliceTranscript.js";
import IncrementalQuiz from "../Models/IncrementalQuiz.js";

const router = express.Router();

/* =========================================================
   GET COMPLETED COURSES
========================================================= */
router.get("/completed-courses", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const completedCourses = (user.courseProgress || [])
      .filter((c) => c.totalSeconds > 0 && c.watchedSeconds >= c.totalSeconds * 0.9)
      .map((c) => ({
        _id: c.courseId,
        courseId: c.courseId,
        name: c.courseTitle,
        thumbnail: c.courseThumbnail,
        completedAt: c.lastAccessed
      }));

    res.json({
      success: true,
      completedCourses
    });
  } catch (err) {
    console.error("Error fetching completed courses:", err);
    res.status(500).json({ message: "Failed to fetch completed courses" });
  }
});

/* =========================================================
   MANUALLY COMPLETE COURSE (For Certification/Project Map)
========================================================= */
router.post("/complete-course/:courseId", verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.courseProgress) {
      user.courseProgress = [];
    }

    let courseProgress = user.courseProgress.find(c => c.courseId === courseId);

    if (courseProgress) {
      courseProgress.watchedSeconds = courseProgress.totalSeconds || 3600;
      courseProgress.totalSeconds = courseProgress.watchedSeconds;
      courseProgress.lastAccessed = new Date();
    } else {
      user.courseProgress.push({
        courseId,
        courseTitle: "Manually Completed Course",
        channelId: "manual_completion",
        channelName: "Manual Completion",
        totalSeconds: 3600,
        watchedSeconds: 3600,
        lastAccessed: new Date(),
        videos: []
      });
    }

    await user.save();

    try {
      await sendCourseCompletedNotification(user._id, courseId, courseProgress?.courseTitle || "Course");
    } catch (error) {
      console.error("Notification failed", error);
    }

    res.json({ success: true, message: "Course marked as completed" });

  } catch (err) {
    console.error("Error completing course:", err);
    res.status(500).json({ message: "Failed to complete course" });
  }
});


/* =========================================================
   PORTFOLIO & PROJECTS
========================================================= */
router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const interviews = user.interviewAttempts || [];
    const aptitude = user.aptitudeAttempts || [];
    const projects = user.projects || [];

    const codingInterviews = interviews.filter(i =>
      i.role?.toLowerCase().includes('coding') ||
      i.role?.toLowerCase().includes('programming') ||
      i.role?.toLowerCase().includes('algorithm') ||
      i.role?.toLowerCase().includes('dsa') ||
      i.role?.toLowerCase().includes('technical')
    );
    const logicAccuracy = codingInterviews.length > 0
      ? Math.round(codingInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / codingInterviews.length)
      : 0;

    const communicationInterviews = interviews.filter(i =>
      i.role?.toLowerCase().includes('hr') ||
      i.role?.toLowerCase().includes('behavioral') ||
      i.role?.toLowerCase().includes('communication') ||
      (i.feedback && i.feedback.length > 20)
    );
    const commSkills = communicationInterviews.length > 0
      ? Math.round(communicationInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / communicationInterviews.length)
      : (interviews.length > 0 ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length) : 0);

    const systemDesignInterviews = interviews.filter(i =>
      !i.role?.toLowerCase().includes('hr') &&
      !i.role?.toLowerCase().includes('behavioral')
    );
    const systemDesign = systemDesignInterviews.length > 0
      ? Math.round(systemDesignInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / systemDesignInterviews.length)
      : 0;

    const cultureFitInterviews = interviews.filter(i =>
      i.role?.toLowerCase().includes('hr') ||
      i.role?.toLowerCase().includes('cultural') ||
      i.role?.toLowerCase().includes('behavioral') ||
      (i.feedback && (
        i.feedback.toLowerCase().includes('good') ||
        i.feedback.toLowerCase().includes('great') ||
        i.feedback.toLowerCase().includes('excellent') ||
        i.feedback.toLowerCase().includes('strong')
      ))
    );
    const cultureFit = cultureFitInterviews.length > 0
      ? Math.round(cultureFitInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / cultureFitInterviews.length)
      : (interviews.length > 0 ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length) : 0);

    res.status(200).json({
      success: true,
      user: {
        name: user.name || "User",
        bio: user.bio || "Passionate developer building amazing things.",
        avatarUrl: user.avatarUrl || "/swaroopProfile.jpg",
        profilePic: user.profilePic || null,
        location: user.location || {},
      },
      skills: user.courseProgress || [],
      interviews: interviews,
      aptitude: aptitude,
      projects: projects,
      metrics: {
        logicAccuracy,
        commSkills,
        systemDesign,
        cultureFit
      }
    });
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   PROJECT MANAGEMENT ENDPOINTS
========================================================= */

// CREATE PROJECT
router.post("/projects", verifyToken, async (req, res) => {
  try {
    const { title, description, tags, imageUrl, liveLink, githubLink, featured } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required"
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newProject = {
      title: title.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags.filter(t => t.trim()) : [],
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      liveLink: liveLink?.trim() || "",
      githubLink: githubLink?.trim() || "",
      featured: Boolean(featured),
    };

    user.projects.push(newProject);
    await user.save();

    const createdProject = user.projects[user.projects.length - 1];

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: createdProject,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET ALL PROJECTS (for current user)
router.get("/projects", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("projects").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      projects: user.projects || [],
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE PROJECT
router.get("/projects/:projectId", verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const user = await User.findById(req.userId).select("projects").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const project = user.projects.find(p => p._id.toString() === projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE PROJECT
router.put("/projects/:projectId", verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, tags, imageUrl, liveLink, githubLink, featured } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const project = user.projects.id(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (tags !== undefined) project.tags = Array.isArray(tags) ? tags.filter(t => t.trim()) : [];
    if (imageUrl !== undefined) project.imageUrl = imageUrl;
    if (liveLink !== undefined) project.liveLink = liveLink?.trim() || "";
    if (githubLink !== undefined) project.githubLink = githubLink?.trim() || "";
    if (featured !== undefined) project.featured = Boolean(featured);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE PROJECT
router.delete("/projects/:projectId", verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const projectIndex = user.projects.findIndex(p => p._id.toString() === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    user.projects.splice(projectIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   PROFILE
========================================================= */

// FETCH PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// UPDATE PROFILE
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, bio, location } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (location) user.location = location;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...user.toObject(),
        password: undefined
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   UPLOAD PROFILE PICTURE
========================================================= */
router.post("/upload-profile-pic", verifyToken, async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });



    user.profilePic = profilePic;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePic: user.profilePic
    });
  } catch (err) {
    console.error("Profile pic upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   START LEARNING
========================================================= */
router.post("/start-learning", verifyToken, async (req, res) => {
  const {
    courseId,
    courseTitle,
    channelId,
    channelName,
    channelThumbnail,
  } = req.body;

  if (!courseId || !courseTitle || !channelId || !channelName) {
    return res.status(400).json({ message: "Missing data" });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  if (!user.courseProgress) {
    user.courseProgress = [];
  }

  const courseIdStr = String(courseId);
  const channelIdStr = String(channelId);

  const existingEntries = user.courseProgress.filter(
    (c) => String(c.courseId) === courseIdStr && String(c.channelId) === channelIdStr
  );

  const saveWithRetry = async (currentUser) => {
    let retries = 3;
    while (retries > 0) {
      try {
        await currentUser.save();
        return;
      } catch (err) {
        if (err.name === "VersionError" && retries > 1) {
          retries--;
          console.warn("[Start Learning] Mongoose version collision. Retrying save with fresh document state...");
          const freshUser = await User.findById(currentUser._id);
          if (!freshUser) throw err;
          
          if (!freshUser.courseProgress) freshUser.courseProgress = [];
          
          const freshExisting = freshUser.courseProgress.filter(
            (c) => String(c.courseId) === courseIdStr && String(c.channelId) === channelIdStr
          );
          
          if (freshExisting.length > 0) {
            const entryWithMostProgress = freshExisting.reduce((max, current) =>
              (current.watchedSeconds || 0) > (max.watchedSeconds || 0) ? current : max
            );
            freshUser.courseProgress = freshUser.courseProgress.filter(
              (c) => !(String(c.courseId) === courseIdStr && String(c.channelId) === channelIdStr)
            );
            freshUser.courseProgress.push(entryWithMostProgress);
          } else {
            freshUser.courseProgress.push({
              courseId,
              courseTitle,
              channelId,
              channelName,
              channelThumbnail,
              totalSeconds: 0,
              watchedSeconds: 0,
              videos: [],
              startedAt: new Date(),
              lastAccessed: new Date(),
            });
          }
          currentUser = freshUser;
        } else {
          throw err;
        }
      }
    }
  };

  if (existingEntries.length > 0) {
    const entryWithMostProgress = existingEntries.reduce((max, current) =>
      (current.watchedSeconds || 0) > (max.watchedSeconds || 0) ? current : max
    );

    user.courseProgress = user.courseProgress.filter(
      (c) => !(String(c.courseId) === courseIdStr && String(c.channelId) === channelIdStr)
    );

    user.courseProgress.push(entryWithMostProgress);
    await saveWithRetry(user);
  } else {
    user.courseProgress.push({
      courseId,
      courseTitle,
      channelId,
      channelName,
      channelThumbnail,
      totalSeconds: 0,
      watchedSeconds: 0,
      videos: [],
      startedAt: new Date(),
      lastAccessed: new Date(),
    });

    await saveWithRetry(user);
    await sendCourseStartedNotification(req.userId, courseTitle, channelName);
  }

  return res.json({ success: true });
});

const summarizedVideos = new Set();

async function generateAndPrintSummary(videoId) {
  if (!videoId) return;
  if (summarizedVideos.has(videoId)) return;

  try {
    // 1. Check if summary is already cached in database
    const cachedSummary = await VideoSummary.findOne({ videoId });
    if (cachedSummary) {
      // Mark in local memory set to skip future DB lookups in this session
      summarizedVideos.add(videoId);
      
      console.log(`\n======================================================================`);
      console.log(`[Summary Generator] Video ID: ${videoId} (RETRIEVED FROM DATABASE CACHE)`);
      console.log(`======================================================================`);
      console.log(cachedSummary.summary);
      console.log(`======================================================================\n`);
      return;
    }

    // 2. Mark in local memory set before starting async operations to prevent parallel execution
    summarizedVideos.add(videoId);

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`\n[Summary Generator] Video start detected for ID: ${videoId} (No DB Cache found)`);
    console.log(`[Summary Generator] Fetching transcript...`);
    const transcript = await getTranscript(url);
    if (!transcript || transcript.length === 0) {
      console.log(`[Summary Generator] No transcript available for video: ${videoId}`);
      // Remove from set so we can retry later if transcript is added or network transient
      summarizedVideos.delete(videoId);
      return;
    }
    
    console.log(`[Summary Generator] Transcript loaded (${transcript.length} lines). Generating summary using Groq AI...`);
    const summary = await generateSummary(transcript, videoId);
    
    // Save to Database Cache (handle concurrent write races gracefully)
    try {
      await VideoSummary.create({ videoId, summary });
      console.log(`[Summary Generator] Summary saved to database cache successfully.`);
    } catch (dbErr) {
      if (dbErr.code !== 11000 && dbErr.writeErrors?.[0]?.code !== 11000) {
        throw dbErr;
      }
      console.log(`[Summary Generator] Video ${videoId} summary was already saved by a concurrent request.`);
    }

    console.log(`\n======================================================================`);
    console.log(`[Summary Generator] SUMMARY FOR VIDEO: ${videoId} (NEW GENERATION SAVED TO DB)`);
    console.log(`======================================================================`);
    console.log(summary);
    console.log(`======================================================================\n`);
  } catch (err) {
    console.error(`[Summary Generator] Error during summary generation/lookup for video ${videoId}:`, err.message);
    // Remove from memory set on failure so we can retry on next progress save
    summarizedVideos.delete(videoId);
  }
}

const generatedQuizzesSet = new Set();

async function generateAndPrintQuizzes(videoId) {
  if (!videoId) return;
  if (generatedQuizzesSet.has(videoId)) return;

  try {
    generatedQuizzesSet.add(videoId);
    const cached = await CacheManager.getCachedQuizzes(videoId);
    if (cached) {
      console.log(`[Quiz Generator] Cache hit for video ${videoId}. Bypassing pipeline.`);
      return;
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    processVideoQuizzesInBackground(videoId, url).catch(err => {
      console.error(`[Quiz Pipeline] Background pipeline execution failed for video ${videoId}:`, err.message);
      generatedQuizzesSet.delete(videoId);
    });
  } catch (err) {
    console.error(`[Quiz Generator] Error triggering background processing pipeline for ${videoId}:`, err.message);
    generatedQuizzesSet.delete(videoId);
  }
}

/* =========================================================
   VIDEO STARTED LOG TRIGGER
========================================================= */
router.post("/video-started-log", verifyToken, async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  // Trigger summary and quiz generation logs in the background
  generateAndPrintSummary(videoId);
  generateAndPrintQuizzes(videoId);

  return res.json({ success: true });
});

/* =========================================================
   VIDEO PROGRESS (SAVE)
========================================================= */
router.post("/video-progress", verifyToken, async (req, res) => {
  const { videoId, courseId, channelId, watchedSeconds, durationSeconds } =
    req.body;

  if (
    !videoId ||
    !courseId ||
    !channelId ||
    typeof watchedSeconds !== "number" ||
    typeof durationSeconds !== "number"
  ) {
    return res.status(400).json({ message: "Invalid data" });
  }

  // Trigger summary and quiz generation in the background
  generateAndPrintSummary(videoId);
  generateAndPrintQuizzes(videoId);

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.courseProgress) {
    user.courseProgress = [];
  }

  const course = user.courseProgress.find(
    (c) => c.courseId === courseId && c.channelId === channelId
  );

  if (!course) {
    return res.status(404).json({ message: "Course not started yet" });
  }

  let video = course.videos.find((v) => v.videoId === videoId);

  const safeWatched =
    durationSeconds > 0
      ? Math.min(Math.max(watchedSeconds, 0), durationSeconds)
      : Math.max(watchedSeconds, 0);

  if (!video) {
    course.videos.push({
      videoId,
      watchedSeconds: safeWatched,
      durationSeconds,
      completed: safeWatched >= durationSeconds * 0.9,
      updatedAt: new Date(),
    });
  } else {
    video.watchedSeconds = Math.max(video.watchedSeconds, safeWatched);
    video.durationSeconds = durationSeconds;
    video.completed = video.watchedSeconds >= video.durationSeconds * 0.9;
    video.updatedAt = new Date();
  }

  course.watchedSeconds = course.videos.reduce(
    (sum, v) =>
      sum +
      (v.durationSeconds > 0
        ? Math.min(v.watchedSeconds, v.durationSeconds)
        : v.watchedSeconds),
    0
  );

  const isCourseCompleted = course.totalSeconds > 0 &&
    course.watchedSeconds >= course.totalSeconds * 0.9;

  const wasCourseAlreadyCompleted = course.completed;
  course.completed = isCourseCompleted;

  course.lastAccessed = new Date();

  await user.save();

  if (isCourseCompleted && !wasCourseAlreadyCompleted) {
    await sendCourseCompletedNotification(req.userId, course.courseTitle, course.channelName);
  }

  res.json({ success: true });
});

/* =========================================================
   CHECK IF VIDEO SUMMARY IS CACHED
========================================================= */
router.get("/video-summary/:videoId/check", verifyToken, async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  try {
    const cachedSummary = await VideoSummary.findOne({ videoId });
    return res.json({
      success: true,
      exists: !!cachedSummary,
    });
  } catch (err) {
    console.error(`[Summary Generator] Error checking summary cache:`, err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================================
   SAVE A MANUALLY ENTERED VIDEO SUMMARY
========================================================= */
router.post("/video-summary", async (req, res) => {
  const { videoId: videoReference, summary } = req.body;

  if (!videoReference || !summary?.trim()) {
    return res.status(400).json({
      success: false,
      message: "videoId and summary are required",
    });
  }

  try {
    // Accept either an 11-character YouTube ID or a full YouTube URL in
    // the same videoId field, but always store the canonical ID.
    const extractYouTubeVideoId = (value) => {
      const raw = String(value).trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

      try {
        const url = new URL(raw);
        if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) {
          return url.pathname.split("/").filter(Boolean)[0] || null;
        }
        if (url.hostname.includes("youtube.com")) {
          return url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || null;
        }
      } catch {
        return null;
      }
      return null;
    };

    const videoId = extractYouTubeVideoId(videoReference);
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid YouTube video ID or complete YouTube video link.",
      });
    }

    // Thunder Client only needs videoId and summary. Find the associated course
    // metadata from the user progress records already stored by the application.
    const userWithVideo = await User.findOne({
      "courseProgress.videos.videoId": videoId,
    }).lean();
    const course = userWithVideo?.courseProgress?.find((item) =>
      item.videos?.some((video) => video.videoId === videoId)
    );

    let videoMetadata = {};
    if (String(videoReference).startsWith("http")) {
      try {
        const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const metadataResponse = await fetch(
          `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonicalUrl)}`
        );
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          videoMetadata = {
            videoTitle: metadata.title,
            channelName: metadata.author_name,
          };
        }
      } catch (metadataError) {
        // Saving a manual summary should still work if YouTube is unavailable.
        console.warn("[Summary Generator] YouTube metadata lookup failed:", metadataError.message);
      }
    }

    const saved = await VideoSummary.findOneAndUpdate(
      { videoId },
      {
        summary: summary.trim(),
        courseName: course?.courseTitle || videoMetadata.videoTitle || "Unknown Course",
        channelName: course?.channelName || videoMetadata.channelName || "Unknown Channel",
        videoTitle: videoMetadata.videoTitle || "Unknown Video",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: "Summary saved",
      summary: saved.summary,
    });
  } catch (err) {
    console.error("[Summary Generator] Failed to save manual summary:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save summary",
    });
  }
});

/* =========================================================
   STREAM VIDEO SUMMARY PROGRESS (SSE)
========================================================= */
router.get("/video-summary/:videoId/stream", verifyToken, async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) return res.status(400).json({ success: false, message: "Video ID is required" });

  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  let closed = false;
  const send = (event, data) => {
    if (!closed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const heartbeat = setInterval(() => send("ping", { at: Date.now() }), 15_000);
  req.on("close", () => {
    closed = true;
    clearInterval(heartbeat);
  });

  try {
    const cachedSummary = await VideoSummary.findOne({ videoId });
    if (cachedSummary) {
      send("complete", { summary: cachedSummary.summary, cached: true });
      return res.end();
    }

    send("progress", { type: "stage", stage: "fetching_transcript" });
    const transcript = await getTranscript(`https://www.youtube.com/watch?v=${videoId}`);
    if (!transcript?.length) {
      send("error", { message: "No transcript available for this video." });
      return res.end();
    }

    const summary = await generateSummary(transcript, videoId, (progress) => send("progress", progress));
    try {
      await VideoSummary.create({ videoId, summary });
    } catch (dbErr) {
      if (dbErr.code !== 11000 && dbErr.writeErrors?.[0]?.code !== 11000) throw dbErr;
    }
    send("complete", { summary, cached: false });
  } catch (err) {
    console.error(`[Summary Generator] Streaming summary failed for ${videoId}:`, err.message);
    send("error", { message: "Failed to generate video summary." });
  } finally {
    clearInterval(heartbeat);
    if (!closed) res.end();
  }
});

/* =========================================================
   FETCH OR GENERATE VIDEO SUMMARY
========================================================= */
router.get("/video-summary/:videoId", verifyToken, async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  try {
    // 1. Check if summary is already cached in database
    let cachedSummary = await VideoSummary.findOne({ videoId });
    if (cachedSummary) {
      console.log(`[Summary Generator] Video ID: ${videoId} fetched from DB cache for client request.`);
      return res.json({
        success: true,
        summary: cachedSummary.summary,
        cached: true,
      });
    }

    // 2. Not cached - generate now
    console.log(`[Summary Generator] Client requested summary for Video ID: ${videoId} (No cache found). Generating...`);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const transcript = await getTranscript(url);
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transcript available for this video.",
      });
    }

    const summary = await generateSummary(transcript, videoId);

    // Save to Database Cache (handle concurrent write races gracefully)
    try {
      await VideoSummary.create({ videoId, summary });
      console.log(`[Summary Generator] Summary saved to database cache successfully.`);
    } catch (dbErr) {
      if (dbErr.code !== 11000 && dbErr.writeErrors?.[0]?.code !== 11000) {
        throw dbErr;
      }
      console.log(`[Summary Generator] Video ${videoId} summary was already saved by a concurrent request.`);
    }

    return res.json({
      success: true,
      summary,
      cached: false,
    });
  } catch (err) {
    console.error(`[Summary Generator] Error in GET /video-summary/${videoId}:`, err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate summary.",
      error: err.message,
    });
  }
});

/* =========================================================
   DOWNLOAD VIDEO SUMMARY AS PDF
========================================================= */
router.get("/video-summary/:videoId/download", verifyToken, async (req, res) => {
  const { videoId } = req.params;
  const { title, channelName } = req.query;

  if (!videoId) {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  try {
    const cachedSummary = await VideoSummary.findOne({ videoId });
    if (!cachedSummary) {
      return res.status(404).json({ success: false, message: "Summary not found" });
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set Response Headers for PDF
    const videoTitle = title || "Video Summary";
    const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedTitle}_summary.pdf"`
    );

    // Pipe PDF doc to response
    doc.pipe(res);

    // Draw header / banner
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Header Banner
    doc.fillColor("#1E40AF").rect(0, 0, pageWidth, 90).fill();
    doc.fillColor("#FFFFFF")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("PREPVIO AI VIDEO SUMMARY", margin, 25);

    doc.fontSize(10)
      .font("Helvetica")
      .text(`Date: ${new Date().toLocaleDateString()}`, margin, 55);

    doc.moveDown(4);

    // Title Section
    doc.fillColor("#111827")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(videoTitle, margin, 110, { width: contentWidth });

    // Channel Name Section
    if (channelName) {
      doc.fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#4B5563")
        .text(`Channel: ${channelName}`, margin, doc.y + 4, { width: contentWidth });
    }

    // Video Source
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    doc.fontSize(10)
      .font("Helvetica-Oblique")
      .fillColor("#4B5563")
      .text(`Source URL: ${videoUrl}`, margin, doc.y + 6, { link: videoUrl, underline: true });

    // Decorative Horizontal Line
    doc.moveDown(1.5);
    const startY = doc.y;
    doc.moveTo(margin, startY)
      .lineTo(pageWidth - margin, startY)
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .stroke();

    doc.moveDown(1.5);

    // ── Markdown-aware PDF rendering ──────────────────────────
    // Helper: strip inline markdown markers to plain text for PDF
    const stripInlineMarkdown = (text) => {
      return text
        .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold** → bold
        .replace(/\*(.+?)\*/g, "$1")        // *italic* → italic
        .replace(/`(.+?)`/g, "$1")          // `code` → code
        .trim();
    };

    // Helper: detect if a line's main content is bold-wrapped
    const isBoldLine = (text) => {
      const stripped = text.trim();
      return stripped.startsWith("**") && stripped.endsWith("**");
    };

    // Helper: render a text block with proper font and dimensions
    const renderTextBlock = (text, options = {}) => {
      const {
        font = "Helvetica",
        color = "#374151",
        size = 11,
        indent = 0,
        align = "left",
        lineGapVal = 4,
      } = options;

      doc
        .font(font)
        .fillColor(color)
        .fontSize(size)
        .lineGap(lineGapVal);

      const xPos = margin + indent;
      const availWidth = contentWidth - indent;

      doc.text(text, xPos, doc.y, {
        width: availWidth,
        align,
      });
    };

    // Split the full summary into individual lines for line-by-line parsing
    const lines = cachedSummary.summary.split(/\r?\n/);
    doc.fillColor("#374151").font("Helvetica").fontSize(11).lineGap(4);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines (just add spacing)
      if (!trimmed) {
        doc.moveDown(0.4);
        continue;
      }

      // ── Horizontal rule ───────────────────────────────────
      if (/^[-*_]{3,}$/.test(trimmed)) {
        doc.moveDown(0.5);
        const ruleY = doc.y;
        doc.moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY)
          .strokeColor("#D1D5DB").lineWidth(1).stroke();
        doc.moveDown(0.5);
        continue;
      }

      // ── Headings ──────────────────────────────────────────
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = stripInlineMarkdown(headingMatch[2]);
        const sizes = { 1: 18, 2: 15, 3: 13, 4: 12 };
        const gaps  = { 1: 1.2, 2: 1, 3: 0.8, 4: 0.6 };

        doc.moveDown(gaps[level]);
        renderTextBlock(headingText, {
          font: "Helvetica-Bold",
          color: "#111827",
          size: sizes[level],
        });

        // Underline for h1 / h2
        if (level <= 2) {
          const lineY = doc.y + 2;
          doc.moveTo(margin, lineY).lineTo(pageWidth - margin, lineY)
            .strokeColor("#E5E7EB").lineWidth(0.75).stroke();
          doc.moveDown(0.3);
        }
        continue;
      }

      // ── Bold-wrapped standalone line (e.g. **Section Title**) ──
      if (isBoldLine(trimmed)) {
        const boldText = stripInlineMarkdown(trimmed);
        doc.moveDown(0.6);
        renderTextBlock(boldText, {
          font: "Helvetica-Bold",
          color: "#111827",
          size: 12,
        });
        doc.moveDown(0.2);
        continue;
      }

      // ── Blockquote ────────────────────────────────────────
      if (trimmed.startsWith(">")) {
        const quoteText = stripInlineMarkdown(trimmed.replace(/^>\s*/, ""));
        const quoteX = margin + 12;
        const barX = margin + 4;
        const savedY = doc.y;

        // Measure height first so we can draw the background properly
        const quoteHeight = doc.heightOfString(quoteText, { width: contentWidth - 16, font: "Helvetica-Oblique", size: 10 });
        const bgHeight = Math.max(quoteHeight + 8, 20);

        doc.fillColor("#EEF2FF").rect(margin, savedY - 2, contentWidth, bgHeight).fill();
        doc.moveTo(barX, savedY - 2).lineTo(barX, savedY - 2 + bgHeight)
          .strokeColor("#818CF8").lineWidth(3).stroke();

        doc.fillColor("#4338CA").font("Helvetica-Oblique").fontSize(10);
        doc.text(quoteText, quoteX, savedY + 2, { width: contentWidth - 16 });
        doc.fillColor("#374151").font("Helvetica").fontSize(11);
        doc.moveDown(0.3);
        continue;
      }

      // ── Unordered list ────────────────────────────────────
      const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
      if (ulMatch) {
        const bulletText = stripInlineMarkdown(ulMatch[1]);
        renderTextBlock(`•   ${bulletText}`, { indent: 12 });
        doc.moveDown(0.15);
        continue;
      }

      // ── Ordered list ──────────────────────────────────────
      const olMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
      if (olMatch) {
        const num = olMatch[1];
        const itemText = stripInlineMarkdown(olMatch[2]);
        renderTextBlock(`${num}.  ${itemText}`, {
          indent: 10,
          font: "Helvetica",
        });
        doc.moveDown(0.15);
        continue;
      }

      // ── Regular paragraph ─────────────────────────────────
      const cleanText = stripInlineMarkdown(trimmed);
      renderTextBlock(cleanText, { align: "justify" });
      doc.moveDown(0.4);
    }

    // Finalize PDF Document
    doc.end();
  } catch (err) {
    console.error(`[Summary Generator] PDF generation error for ${videoId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "PDF generation failed" });
    }
  }
});

/* =========================================================
   FETCH VIDEO PROGRESS
========================================================= */
router.get(
  "/video-progress/:courseId/:channelId",
  verifyToken,
  async (req, res) => {
    const { courseId, channelId } = req.params;

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const courses = user.courseProgress || [];

    const course = courses.find(
      (c) => c.courseId === courseId && c.channelId === channelId
    );

    res.json({
      success: true,
      data: course?.videos || [],
    });
  }
);

/* =========================================================
   MY LEARNING
========================================================= */
router.get("/my-learning", verifyToken, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  let courses = user.courseProgress || [];
  const feedbacks = user.feedbacks || [];

  courses = deduplicateCourseProgress(courses);

  const data = courses.map((course) => {
    let lastVideoId = null;

    if (course.videos?.length) {
      const lastVideo = course.videos.reduce((a, b) =>
        new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a
      );
      lastVideoId = lastVideo.videoId;
    }

    const hasFeedback = feedbacks.some(
      (fb) =>
        fb.courseId === course.courseId &&
        fb.channelId === course.channelId
    );

    return {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      channelId: course.channelId,
      channelName: course.channelName,
      channelThumbnail: course.channelThumbnail,
      watchedSeconds: course.watchedSeconds,
      totalSeconds: course.totalSeconds,
      lastAccessed: course.lastAccessed,
      lastVideoId,
      hasFeedback,
    };
  });

  res.json({ success: true, data });
});

/* =========================================================
   RESET COURSE
========================================================= */
router.delete(
  "/course-progress/:courseId/:channelId",
  verifyToken,
  async (req, res) => {
    const { courseId, channelId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.courseProgress = (user.courseProgress || []).filter(
      (c) => !(c.courseId === courseId && c.channelId === channelId)
    );

    await user.save();
    res.json({ success: true });
  }
);

/* =========================================================
   WATCH LATER
========================================================= */
router.post("/watch-later", verifyToken, async (req, res) => {
  const { videoId, title, thumbnail, channelId, channelName, courseId } =
    req.body;

  if (!videoId) {
    return res.status(400).json({ message: "Video ID required" });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const exists = user.savedVideos.find((v) => v.videoId === videoId);
  if (exists) {
    return res.status(400).json({ message: "Already saved" });
  }

  user.savedVideos.push({
    videoId,
    title,
    thumbnail,
    channelId,
    channelName,
    courseId,
  });

  await user.save();
  res.json({ success: true });
});

router.get("/watch-later", verifyToken, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ success: true, data: user.savedVideos || [] });
});

router.delete("/watch-later/:videoId", verifyToken, async (req, res) => {
  const { videoId } = req.params;

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.savedVideos = (user.savedVideos || []).filter(
    (v) => v.videoId !== videoId
  );

  await user.save();
  res.json({ success: true });
});

/* =========================================================
   UPDATE COURSE TOTAL
========================================================= */
router.post("/update-course-total", verifyToken, async (req, res) => {
  const { courseId, channelId, totalSeconds } = req.body;

  if (!courseId || !channelId || typeof totalSeconds !== "number") {
    return res.status(400).json({ message: "Invalid data" });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.courseProgress) {
    user.courseProgress = [];
  }

  const course = user.courseProgress.find(
    (c) => c.courseId === courseId && c.channelId === channelId
  );

  if (!course) return res.status(404).json({ message: "Course not found" });

  if (course.totalSeconds !== totalSeconds) {
    course.totalSeconds = totalSeconds;
    await user.save();
  }

  res.json({ success: true });
});

/* =========================================================
   DASHBOARD
========================================================= */
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalCount = (user.courseProgress || []).length;
    const deduplicatedProgress = deduplicateCourseProgress(user.courseProgress || []);

    if (deduplicatedProgress.length < originalCount) {
      await User.findByIdAndUpdate(req.userId, { courseProgress: deduplicatedProgress });
    }

    const courses = deduplicatedProgress.map((c) => {
      const completed =
        c.totalSeconds > 0 && c.watchedSeconds >= c.totalSeconds * 0.9;

      return {
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        channelId: c.channelId,
        channelName: c.channelName,
        channelThumbnail: c.channelThumbnail,
        totalSeconds: c.totalSeconds,
        watchedSeconds: c.watchedSeconds,
        completed,
        lastAccessed: c.lastAccessed,
      };
    });

    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.completed).length;
    const inProgressCourses = totalCourses - completedCourses;

    const totalWatchedSeconds = courses.reduce(
      (sum, c) => sum + (c.watchedSeconds || 0),
      0
    );

    const resumeCourse = courses
      .filter(c => !c.completed && c.watchedSeconds > 0)
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0];

    const getWeekBucket = (date) => {
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 7) return "This Week";
      if (diffDays <= 14) return "Last Week";
      if (diffDays <= 21) return "2 Weeks Ago";
      return "3 Weeks Ago";
    };

    const weeklyActivity = {
      "3 Weeks Ago": 0,
      "2 Weeks Ago": 0,
      "Last Week": 0,
      "This Week": 0,
    };

    deduplicatedProgress.forEach(course => {
      if (course.lastAccessed && course.watchedSeconds > 0) {
        const bucket = getWeekBucket(course.lastAccessed);
        weeklyActivity[bucket] += course.watchedSeconds;
      }
    });

    Object.keys(weeklyActivity).forEach(key => {
      weeklyActivity[key] =
        Math.round((weeklyActivity[key] / 3600) * 10) / 10;
    });

    res.json({
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalWatchedHours: Math.floor(totalWatchedSeconds / 3600),
      },
      courses,
      resume: resumeCourse
        ? {
          courseId: resumeCourse.courseId,
          channelId: resumeCourse.channelId,
          videoId: null,
        }
        : null,
      weeklyActivity,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

/* =========================================================
   ADMIN: GET ALL USERS (FOR USER MANAGEMENT)
========================================================= */
router.get("/admin/all-users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("firstName lastName name email isVerified createdAt");

    res.json({
      success: true,
      data: users.map(u => ({
        id: u._id,
        name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "No Name",
        email: u.email,
        featureAccess: "All Features",
        status: u.isVerified ? "Active" : "Suspended"
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* =========================================================
   ADMIN: FULL USER LEARNING DETAILS
========================================================= */
router.get("/admin/user/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const courses = (user.courseProgress || []).map(course => ({
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      channelName: course.channelName,
      watchedSeconds: course.watchedSeconds,
      totalSeconds: course.totalSeconds,
      completed: course.totalSeconds > 0 &&
        course.watchedSeconds >= course.totalSeconds,
      videos: (course.videos || []).map(video => ({
        videoId: video.videoId,
        watchedSeconds: video.watchedSeconds,
        durationSeconds: video.durationSeconds,
        completed: video.completed,
        updatedAt: video.updatedAt,
      })),
    }));

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name",
        email: user.email,
      },
      courses,
      savedVideos: user.savedVideos || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

/* =========================================================
   SUBMIT FEEDBACK
========================================================= */
router.post("/feedback", verifyToken, async (req, res) => {
  try {
    const { courseId, channelId, category, rating, message } = req.body;

    if (!message || !category) {
      return res.status(400).json({ message: "Missing feedback data" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isCourseFeedback = Boolean(courseId && channelId);

    user.feedbacks.push({
      userId: req.userId,
      courseId: isCourseFeedback ? courseId : null,
      channelId: isCourseFeedback ? channelId : null,
      type: isCourseFeedback ? "course" : "general",
      category,
      rating,
      message,
    });

    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Feedback save error:", err);
    res.status(500).json({ message: "Failed to save feedback" });
  }
});

/* =========================================================
   SUBMIT APTITUDE TEST
========================================================= */
router.post("/aptitude/submit", verifyToken, async (req, res) => {
  const {
    topic,
    totalQuestions,
    correctAnswers,
    percentage,
    timeTakenSeconds,
    answers,
  } = req.body;

  if (
    typeof topic !== "string" ||
    typeof totalQuestions !== "number" ||
    !Array.isArray(answers) ||
    answers.length === 0
  ) {
    return res.status(400).json({ message: "Invalid aptitude data" });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  user.aptitudeAttempts.push({
    topic,
    totalQuestions,
    correctAnswers,
    percentage,
    timeTakenSeconds,
    answers: answers.map((a) => ({
      questionId: String(a.questionId),
      question: String(a.question || ""),
      options: Array.isArray(a.options)
        ? a.options.map((o) => ({
          text: typeof o === "string" ? o : o.text,
        }))
        : [],
      explanation: a.explanation || "",
      difficulty: typeof a.difficulty === "string" ? a.difficulty.toLowerCase() : "medium",
      selectedIndex: (a.selectedIndex !== undefined && a.selectedIndex !== null && !isNaN(Number(a.selectedIndex)))
        ? Number(a.selectedIndex)
        : null,
      correctIndex: Number(a.correctIndex),
      isCorrect: Boolean(a.isCorrect),
    })),
  });

  try {
    await user.save();
  } catch (err) {
    console.error("❌ Aptitude save failed:", err);
    return res.status(500).json({ message: "DB save failed" });
  }

  return res.json({ success: true });
});

/* =========================================================
   GET USER APTITUDE ATTEMPTS
========================================================= */
router.get("/aptitude/attempts", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("aptitudeAttempts")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: user.aptitudeAttempts || [],
    });
  } catch (err) {
    console.error("Fetch aptitude attempts error:", err);
    res.status(500).json({ message: "Failed to fetch aptitude attempts" });
  }
});

/* =========================================================
   GET LATEST APTITUDE ATTEMPT
========================================================= */
router.get("/aptitude/latest", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("aptitudeAttempts")
      .lean();

    if (!user || !user.aptitudeAttempts?.length) {
      return res.json({ success: true, data: null });
    }

    const latestAttempt =
      user.aptitudeAttempts[user.aptitudeAttempts.length - 1];

    res.json({
      success: true,
      data: latestAttempt,
    });
  } catch (err) {
    console.error("Fetch latest aptitude error:", err);
    res.status(500).json({ message: "Failed to fetch latest aptitude attempt" });
  }
});

/* =========================================================
   ADMIN: DELETE USER
========================================================= */
router.delete("/admin/delete/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

export default router;
