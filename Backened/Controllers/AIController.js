import { GoogleGenAI } from "@google/genai";
import IncrementalQuiz from "../Models/IncrementalQuiz.js";
import { CacheManager } from "../services/cacheManager.js";
import { processVideoQuizzesInBackground } from "../services/videoProcessingPipeline.js";
import { DbService } from "../services/dbService.js";

function extractVideoId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
}

export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("AI Error: GEMINI_API_KEY is missing in environment variables");
            return res.status(500).json({ success: false, message: "AI configuration missing" });
        }

        // Initialize Gemini Client inside the handler to ensure env is loaded
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('AI Request received:', message);

        // Generate content using @google/genai
        const result = await model.generateContent(message);
        const response = await result.response;
        const reply = response.text();

        console.log('AI Response generated successfully');

        return res.status(200).json({ success: true, reply });

    } catch (error) {
        console.error("AI Chat Error Detail:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process AI request",
            error: error.message
        });
    }
};

export const analyzeVideoTranscript = async (req, res) => {
    try {
        const { url, transcript: transcriptText } = req.body;

        if (!url && !transcriptText) {
            return res.status(400).json({
                success: false,
                message: "YouTube URL or transcript text is required",
            });
        }

        const videoId = extractVideoId(url) || "unknown_video";

        // Check cache using CacheManager
        const cached = await CacheManager.getCachedQuizzes(videoId);
        if (cached) {
            console.log(`[Quiz Controller] Cache hit for video ${videoId}. Returning cached results.`);
            return res.status(200).json({
                success: true,
                totalTopics: cached.length,
                data: cached.map(q => ({
                    _id: q._id,
                    topic: q.topic,
                    videoId: q.videoId,
                    startTime: q.startTime,
                    endTime: q.endTime,
                    triggerTime: q.triggerTime,
                    status: q.status,
                    questions: q.questions || []
                }))
            });
        }

        // Fire and forget background processing pipeline!
        processVideoQuizzesInBackground(videoId, url || transcriptText).catch(err => {
            console.error(`[Quiz Pipeline] Background pipeline execution failed for video ${videoId}:`, err.message);
        });

        // Return immediately to avoid waiting (Stage READY or PENDING depending on status)
        // Give the background pipeline a quick 500ms head start to initialize PENDING records in database
        await new Promise(resolve => setTimeout(resolve, 500));

        const freshState = await DbService.findQuizzesForVideo(videoId);

        return res.status(200).json({
            success: true,
            totalTopics: freshState.length,
            data: freshState.map(q => ({
                _id: q._id,
                topic: q.topic,
                videoId: q.videoId,
                startTime: q.startTime,
                endTime: q.endTime,
                triggerTime: q.triggerTime,
                status: q.status,
                questions: q.questions || []
            }))
        });
    } catch (error) {
        console.error("Analyze Transcript Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze transcript",
        });
    }
};

export const getIncrementalQuizzes = async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!videoId) {
            return res.status(400).json({ success: false, message: "Video ID is required" });
        }

        const quizzes = await DbService.findQuizzesForVideo(videoId);
        return res.status(200).json({
            success: true,
            totalTopics: quizzes.length,
            data: quizzes.map(q => ({
                _id: q._id,
                topic: q.topic,
                videoId: q.videoId,
                startTime: q.startTime,
                endTime: q.endTime,
                triggerTime: q.triggerTime,
                status: q.status,
                questions: q.questions || []
            }))
        });
    } catch (error) {
        console.error("Get Incremental Quizzes Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch incremental quizzes"
        });
    }
};

export const summarizeVideoTranscript = async (req, res) => {
    try {
        const { url, transcript: transcriptText } = req.body;

        if (!url && !transcriptText) {
            return res.status(400).json({
                success: false,
                message: "YouTube URL or transcript text is required",
            });
        }
        
        const videoId = extractVideoId(url) || "unknown_video";
        
        // Return summary text
        // (Summaries are handled separately in summaryGenerator.js)
        return res.status(200).json({ success: true, message: "Summary process triggered" });
    } catch (error) {
        console.error("Summarize Video Transcript Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to summarize transcript"
        });
    }
};