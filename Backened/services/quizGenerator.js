import groq from "./groq.js";
import { prepareTranscriptChunks } from "../Utils/promptLimits.js";
import IncrementalQuiz from "../Models/IncrementalQuiz.js";
import { getTranscript } from "./transcript.js";
import { mergeTranscript } from "../Utils/mergeTranscript.js";
import { detectTopics } from "./topicDetector.js";
import { sliceAllTopics } from "../Utils/sliceTranscript.js";

const QUIZ_MODEL = process.env.GROQ_QUIZ_MODEL || "llama-3.1-8b-instant";
const EXPECTED_OUTPUT_TOKENS = 500; // Reserve output tokens space

// 1. Token Estimation
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Helper to convert MM:SS or HH:MM:SS to milliseconds
function timeToMs(time) {
  if (typeof time === "number") return time * 1000;
  const parts = String(time || "").split(":").map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 * 1000 + seconds * 1000;
  }
  return Number(time) * 1000 || 0;
}

// 2. Question Quality Scoring Validator
// Instead of aggressively rejecting questions by pattern, assign a quality score (0-100).
// Only reject questions that are structurally malformed or truly meaningless.
const QUALITY_THRESHOLD = 30; // Minimum score to accept a question

export function scoreQuestion(q, topicName) {
  if (!q || typeof q !== "object") return { score: 0, reasons: ["MALFORMED_OBJECT"] };
  if (!q.question || typeof q.question !== "string" || q.question.trim().length < 5) return { score: 0, reasons: ["MISSING_OR_EMPTY_QUESTION"] };
  if (!q.options || typeof q.options !== "object") return { score: 0, reasons: ["MISSING_OPTIONS"] };
  if (!q.correctAnswer) return { score: 0, reasons: ["MISSING_CORRECT_ANSWER"] };

  const reasons = [];
  let score = 100; // Start at 100, deduct for issues
  const text = q.question.toLowerCase().trim();

  // --- STRUCTURAL CHECKS (hard reject if fail) ---
  const keys = Object.keys(q.options);
  if (keys.length !== 4 || !keys.includes("A") || !keys.includes("B") || !keys.includes("C") || !keys.includes("D")) {
    return { score: 0, reasons: ["INVALID_OPTIONS_KEYS"] };
  }

  // Check correctAnswer is one of A/B/C/D
  if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
    return { score: 0, reasons: ["INVALID_CORRECT_ANSWER_KEY"] };
  }

  // Check all options have text
  for (const k of ["A", "B", "C", "D"]) {
    if (!q.options[k] || q.options[k].trim().length === 0) {
      return { score: 0, reasons: ["EMPTY_OPTION_TEXT"] };
    }
  }

  // --- TRUE/FALSE and FILL-IN-THE-BLANK (hard reject) ---
  if (text.includes("true or false") || text.includes("true/false")) {
    return { score: 0, reasons: ["TRUE_FALSE_FORMAT"] };
  }
  if (text.includes("fill in the blank") || text.includes("_____")) {
    return { score: 0, reasons: ["FILL_IN_THE_BLANK"] };
  }

  // --- QUALITY DEDUCTIONS (soft penalties, NOT hard rejects) ---

  // Penalty: Very short question (under 5 words)
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 5) {
    score -= 20;
    reasons.push("VERY_SHORT_QUESTION");
  }

  // Penalty: Pure "Define X" question
  if (text.startsWith("define ")) {
    score -= 15;
    reasons.push("DEFINE_FORMAT");
  }

  // Penalty: Exact topic title in question (answerable from title alone)
  const cleanTopic = topicName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const cleanQ = text.replace(/[^a-z0-9 ]/g, "").trim();
  if (cleanTopic.length > 3 && cleanQ === `what is ${cleanTopic}`) {
    score -= 25;
    reasons.push("DIRECTLY_GUESSABLE_FROM_TITLE");
  }

  // Penalty: All options are identical
  const optionValues = Object.values(q.options).map(v => v.toLowerCase().trim());
  const uniqueOptions = new Set(optionValues);
  if (uniqueOptions.size < 3) {
    score -= 30;
    reasons.push("DUPLICATE_OPTIONS");
  }

  // Penalty: Question text is identical to an option (meaningless)
  if (optionValues.includes(text)) {
    score -= 20;
    reasons.push("QUESTION_MATCHES_OPTION");
  }

  return { score: Math.max(0, score), reasons };
}

export function validateQuestion(q, topicName) {
  const { score, reasons } = scoreQuestion(q, topicName);

  if (score < QUALITY_THRESHOLD) {
    console.warn(`[Quiz Validator] Rejected (Score: ${score}/${QUALITY_THRESHOLD}): "${q?.question}" | Reasons: ${reasons.join(", ")}`);
    return false;
  }

  if (reasons.length > 0) {
    console.log(`[Quiz Validator] Accepted with deductions (Score: ${score}): "${q.question}" | Notes: ${reasons.join(", ")}`);
  } else {
    console.log(`[Quiz Validator] Accepted (Score: ${score}): "${q.question}"`);
  }
  return true;
}

// 3. Token-Aware and Rate-Limit-Aware Scheduler
class TokenAwareQuizScheduler {
  constructor(maxTpm = 6000, safetyBuffer = 600, maxConcurrency = 3) {
    this.limit = maxTpm - safetyBuffer; // Safety ceiling (e.g. 5400 TPM)
    this.maxConcurrency = maxConcurrency;
    this.activeWorkers = 0;
    this.history = []; // Sliding window of { timestamp, tokens }
    this.queue = []; // Task queue
    this.isPaused = false;
    this.pauseTimer = null;
    this.timerId = null;
  }

  cleanHistory() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oldLength = this.history.length;
    this.history = this.history.filter(item => item.timestamp > oneMinuteAgo);
    if (this.history.length < oldLength) {
      console.log(`[Quiz Scheduler] Expired tokens released. Current usage: ${this.getCurrentUsage()} TPM`);
    }
  }

  getCurrentUsage() {
    this.cleanHistory();
    return this.history.reduce((sum, item) => sum + item.tokens, 0);
  }

  getRemainingBudget() {
    return Math.max(0, this.limit - this.getCurrentUsage());
  }

  recordTokens(tokens) {
    this.history.push({ timestamp: Date.now(), tokens });
    console.log(`[Quiz Scheduler] Registered ${tokens} tokens. Current usage: ${this.getCurrentUsage()} TPM`);
  }

  pause(durationMs) {
    console.log(`[Quiz Scheduler] Pausing request queue processing for ${Math.round(durationMs)}ms due to rate limits...`);
    this.isPaused = true;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = setTimeout(() => {
      this.isPaused = false;
      console.log(`[Quiz Scheduler] Pause cleared. Resuming request queue.`);
      this.processQueue();
    }, durationMs);
  }

  add(fn, videoId, topic, priority, estimatedTokens) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        videoId,
        topic,
        priority,
        estimatedTokens,
        resolve,
        reject,
        status: "QUEUED"
      });
      console.log(`[Quiz Scheduler] Topic enqueued: "${topic}" (Video: ${videoId}). Est tokens: ${estimatedTokens}. Queue size: ${this.queue.length}`);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.isPaused) {
      console.log("[Quiz Scheduler] Process Queue skipped: Scheduler is paused.");
      return;
    }

    this.cleanHistory();
    if (this.queue.length === 0) return;

    // Prioritize chronologically (lower priority value = earlier topic)
    this.queue.sort((a, b) => a.priority - b.priority);

    // Determine adaptive concurrency based on remaining token budget
    const currentUsage = this.getCurrentUsage();
    let currentMaxConcurrency = this.maxConcurrency;
    if (currentUsage > this.limit * 0.8) {
      currentMaxConcurrency = 1; // Strict token-safe throttling
      console.log(`[Quiz Scheduler] Throttling active concurrency to 1 (High TPM usage: ${currentUsage}/${this.limit})`);
    } else if (currentUsage > this.limit * 0.5) {
      currentMaxConcurrency = 2; // Moderate token-safe throttling
      console.log(`[Quiz Scheduler] Throttling active concurrency to 2 (Moderate TPM usage: ${currentUsage}/${this.limit})`);
    }

    console.log(`[Quiz Scheduler] Queue state check: Concurrency: ${this.activeWorkers}/${currentMaxConcurrency}, Usage: ${currentUsage}/${this.limit} TPM, Queue Size: ${this.queue.length}`);

    for (let i = 0; i < this.queue.length; i++) {
      if (this.activeWorkers >= currentMaxConcurrency) {
        break;
      }

      const task = this.queue[i];
      const remainingBudget = this.getRemainingBudget();

      if (remainingBudget >= task.estimatedTokens) {
        // Remove from queue and start
        this.queue.splice(i, 1);
        i--; // Adjust loop counter for splice deletion

        this.activeWorkers++;
        task.status = "GENERATING";
        console.log(`[Quiz Scheduler] Job started: "${task.topic}" on video ${task.videoId}. Est tokens: ${task.estimatedTokens}. Workers: ${this.activeWorkers}/${currentMaxConcurrency}`);

        (async () => {
          try {
            this.recordTokens(task.estimatedTokens);
            const result = await task.fn();
            task.resolve(result);
          } catch (err) {
            task.reject(err);
          } finally {
            this.activeWorkers--;
            console.log(`[Quiz Scheduler] Job finished: "${task.topic}" on video ${task.videoId}. Workers: ${this.activeWorkers}/${currentMaxConcurrency}`);
            this.processQueue();
          }
        })();
      } else {
        console.log(`[Quiz Scheduler] Job delayed: "${task.topic}" is waiting for token budget (Required: ${task.estimatedTokens}, Available: ${remainingBudget})`);
        
        // Auto-check queue as soon as the oldest token lease in history expires
        const oldestItem = this.history[0];
        if (oldestItem) {
          const timeUntilExpiry = Math.max(100, oldestItem.timestamp + 60000 - Date.now());
          if (!this.timerId) {
            this.timerId = setTimeout(() => {
              this.timerId = null;
              this.processQueue();
            }, timeUntilExpiry + 100);
          }
        }
        break; // Delay subsequent queued jobs chronologically
      }
    }
  }
}
export const scheduler = new TokenAwareQuizScheduler(6000, 600, 3);

// 4. Retry with Exponential Backoff + Rate-Limit-Aware Scheduler Throttling
export async function retryWithBackoff(fn, maxRetries = 5) {
  let attempt = 1;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error.status === 429 || 
                          error.status === 413 ||
                          error.message?.includes("rate_limit_exceeded") || 
                          error.message?.includes("Rate limit reached") ||
                          error.message?.includes("429") ||
                          error.status >= 500;

      // --- 401 INVALID API KEY: do not retry, log actionable info ---
      const isAuthError = error.status === 401 ||
        error?.error?.code === 'invalid_api_key' ||
        error?.message?.includes('invalid_api_key') ||
        error?.message?.includes('Invalid API Key');

      if (isAuthError) {
        const key = process.env.GROQ_API_KEY;
        console.error(
          '[Quiz Pipeline] ❌ GROQ API key is invalid (401 Unauthorized).\n' +
          '  → Action required: update GROQ_API_KEY in Backened/.env\n' +
          `  → Key exists in env: ${Boolean(key)}\n` +
          `  → Key prefix: ${key ? key.slice(0, 7) + '...' : 'N/A'}\n` +
          '  → Get a valid key at: https://console.groq.com'
        );
        throw error; // Do not retry — retrying with a bad key wastes time
      }

      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }

      let waitTimeMs = Math.pow(2, attempt - 1) * 1000 + (Math.random() * 500);
      const retryAfterHeader = error.headers?.['retry-after'] || error.response?.headers?.['retry-after'];
      if (retryAfterHeader) {
        const seconds = parseFloat(retryAfterHeader);
        if (!isNaN(seconds)) {
          waitTimeMs = (seconds * 1000) + 200;
        }
      } else {
        const match = error.message?.match(/try again in ([\d\.]+)s/i);
        if (match) {
          waitTimeMs = (parseFloat(match[1]) * 1000) + 200;
        } else {
          const matchMs = error.message?.match(/retry after ([\d\.]+)ms/i);
          if (matchMs) {
            waitTimeMs = parseFloat(matchMs[1]) + 50;
          }
        }
      }

      console.log(`[Quiz Pipeline] Groq 429/Error encountered. Pausing scheduler for ${Math.round(waitTimeMs)}ms...`);
      scheduler.pause(waitTimeMs);
      
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      attempt++;
    }
  }
}

// 5. Initialize Pending Quizzes in Database (Idempotent calculation of seconds timestamps)
export async function initializePendingQuizzes(videoId, topicTranscripts, transcript) {
  const quizList = [];

  for (const topic of topicTranscripts) {
    const startMs = timeToMs(topic.start);
    const endMs = timeToMs(topic.end);

    const filtered = transcript.filter((item) => {
      return item.offset >= startMs && item.offset < endMs;
    });

    let startTime = startMs / 1000;
    let endTime = endMs / 1000;

    if (filtered.length > 0) {
      startTime = filtered[0].offset / 1000;
      const lastItem = filtered[filtered.length - 1];
      endTime = (lastItem.offset + (lastItem.duration || 0)) / 1000;
    }

    const triggerTime = endTime;

    let existing = await IncrementalQuiz.findOne({ videoId, topic: topic.topic });
    if (!existing) {
      existing = await IncrementalQuiz.create({
        videoId,
        topic: topic.topic,
        startTime,
        endTime,
        triggerTime,
        status: "PENDING",
        questions: [],
      });
      console.log(`[Quiz Pipeline] Topic queued: "${topic.topic}" for video ${videoId} (PENDING)`);
    }

    quizList.push(existing);
  }

  return quizList;
}

// 6. Incremental Quiz Generation Background Queue Task (Token-Aware enqueuer)
export async function queueAndRunQuizzes(videoId, topicTranscripts) {
  console.log(`[Quiz Pipeline] Slicing topics and enqueuing for video ${videoId}...`);

  // Topics are already sorted chronologically
  for (let index = 0; index < topicTranscripts.length; index++) {
    const topic = topicTranscripts[index];

    // Compute duration in seconds to customize quiz length requirements
    const startMs = timeToMs(topic.start);
    const endMs = timeToMs(topic.end);
    const durationSeconds = (endMs - startMs) / 1000;

    // RULE: Very small topic (under 2 minutes / 120 seconds): Skip generation entirely
    if (durationSeconds < 120) {
      console.log(`[Quiz Pipeline] Skipping very small topic "${topic.topic}" (Duration: ${Math.round(durationSeconds)}s < 120s)`);
      await IncrementalQuiz.findOneAndUpdate(
        { videoId, topic: topic.topic },
        { status: "READY", questions: [], generatedAt: new Date() }
      );
      continue;
    }

    // Determine target quantity of questions to generate
    let targetNumQuestions = 1;
    if (durationSeconds >= 120 && durationSeconds < 300) {
      targetNumQuestions = 1; // Small topic: 2-5 minutes
    } else if (durationSeconds >= 300 && durationSeconds < 600) {
      targetNumQuestions = 2; // Medium topic: 5-10 minutes
    } else {
      targetNumQuestions = 3; // Large topic: 10+ minutes (max 3 questions)
    }

    const prompt = `
You are an expert tutor designing conceptual quizzes to reinforce learning.
Generate exactly ${targetNumQuestions} simple, straightforward multiple-choice quiz question(s) in English for the topic: "${topic.topic}", using ONLY the transcript content provided below.

INSTRUCTIONS FOR DIFFICULTY AND STYLE:
1. Target Difficulty: EASY to MODERATE (70% Easy, 30% Medium). Designed for someone who just watched the lecture for the first time.
   - Do NOT generate advanced, complex, or interview-level questions.
   - Avoid questions requiring complex reasoning, multi-step problem solving, or details outside the transcript.
2. Focus on basic comprehension:
   - Identify the correct statement or syntax, recognize correct usage, or understand the purpose of examples demonstrated in the lecture.
   - Use the instructor's explicit code snippets, diagrams, or examples mentioned in the transcript.
3. Concise Format:
   - Question: 10–20 words.
   - Options: 3–10 words per option.
   - Exactly 4 options (A, B, C, D) with one correct answer.
4. Simple Language: Use beginner-friendly English.

Return valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Short question text in English",
      "options": {
        "A": "Short option text",
        "B": "Short option text",
        "C": "Short option text",
        "D": "Short option text"
      },
      "correctAnswer": "B"
    }
  ]
}

Transcript:
${topic.transcript}
`;

    const inputTokens = estimateTokens(prompt);
    const expectedOutputTokens = EXPECTED_OUTPUT_TOKENS;
    const estimatedTotalTokens = inputTokens + expectedOutputTokens;

    // Index as priority (lower number = earlier topic = higher priority)
    const priority = index;

    scheduler.add(async () => {
      try {
        console.log(`[Quiz Pipeline] Topic generation started: "${topic.topic}" for video ${videoId} (Target Qs: ${targetNumQuestions})...`);
        
        await IncrementalQuiz.findOneAndUpdate(
          { videoId, topic: topic.topic },
          { status: "GENERATING" }
        );

        const response = await retryWithBackoff(async () => {
          return await groq.chat.completions.create({
            model: QUIZ_MODEL,
            temperature: 0,
            max_tokens: expectedOutputTokens,
            messages: [
              {
                role: "system",
                content: "You are a quiz generator. You must return ONLY raw JSON matching the requested schema. Do NOT wrap the response in markdown code blocks or any other formatting."
              },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
        });

        const content = response.choices?.[0]?.message?.content || "";
        const parsed = JSON.parse(content);
        const questionsList = parsed?.questions || [];

        // Apply quality validation checks
        const validQuestions = questionsList.filter(q => validateQuestion(q, topic.topic));

        // Filter out duplicate or highly similar questions within the same topic
        const uniqueQuestions = [];
        const seenTexts = new Set();
        for (const q of validQuestions) {
          const normText = q.question.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
          if (!seenTexts.has(normText)) {
            seenTexts.add(normText);
            uniqueQuestions.push(q);
          } else {
            console.warn(`[Quiz Validator] Filtered out duplicate question text for topic "${topic.topic}": "${q.question}"`);
          }
        }

        // Validate that we have at least one high-quality question, otherwise fail
        if (uniqueQuestions.length === 0) {
          throw new Error("Zero questions passed quality validation filters.");
        }

        // Save immediately to MongoDB and update status to READY
        await IncrementalQuiz.findOneAndUpdate(
          { videoId, topic: topic.topic },
          { 
            status: "READY", 
            questions: uniqueQuestions,
            generatedAt: new Date()
          }
        );
        console.log(`[Quiz Pipeline] Topic generation completed & Quiz saved to MongoDB: "${topic.topic}" for video ${videoId} (Status updated to READY)`);
      } catch (err) {
        console.error(`[Quiz Pipeline] Topic generation failed: "${topic.topic}" for video ${videoId}:`, err.message);
        
        await IncrementalQuiz.findOneAndUpdate(
          { videoId, topic: topic.topic },
          { status: "FAILED" }
        );
      }
    }, videoId, topic.topic, priority, estimatedTotalTokens).catch((err) => {
      console.error(`[Quiz Pipeline] Job enqueuing failed for topic "${topic.topic}":`, err.message);
    });
  }
}

// 7. Resume Unfinished Quiz Jobs (Triggers automatically after server restart)
import { DbService } from "./dbService.js";
import { queueManager } from "./queueManager.js";
import { workerManager } from "./workerManager.js";
import { QuizGenerationService } from "./quizGenerationService.js";
import { TranscriptService } from "./transcriptService.js";
import { TopicSegmentationService } from "./topicSegmentationService.js";

export async function resumeUnfinishedQuizJobs() {
  try {
    // --- Pre-flight: validate GROQ_API_KEY before touching the DB ---
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error(
        '[Quiz Pipeline] ⚠️  Skipping quiz resume: GROQ_API_KEY is not set.\n' +
        '  → Action required: add GROQ_API_KEY=<your_key> to Backened/.env\n' +
        '  → Get a key at: https://console.groq.com'
      );
      return;
    }
    console.log(`[Quiz Pipeline] GROQ_API_KEY present (prefix: ${groqKey.slice(0, 7)}...)`);

    console.log("[Quiz Pipeline] Checking for unfinished quiz generation jobs...");
    const unfinishedQuizzes = await DbService.findUnfinishedQuizzes();

    if (unfinishedQuizzes.length === 0) {
      console.log("[Quiz Pipeline] No unfinished jobs found.");
      return;
    }

    const videoMap = new Map();
    for (const doc of unfinishedQuizzes) {
      if (!videoMap.has(doc.videoId)) {
        videoMap.set(doc.videoId, []);
      }
      videoMap.get(doc.videoId).push(doc);
    }

    console.log(`[Quiz Pipeline] Found unfinished jobs for ${videoMap.size} videos. Resuming in background...`);

    for (const [videoId, docs] of videoMap.entries()) {
      try {
        console.log(`[Quiz Pipeline] Resuming job for video ${videoId}...`);
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const transcript = await TranscriptService.getTranscript(url);
        const chunks = mergeTranscript(transcript);
        const topicTranscripts = await TopicSegmentationService.segmentTranscript(transcript, chunks);

        const targets = topicTranscripts.filter(t => 
          docs.some(d => d.topic === t.topic)
        );

        // Queue the resumed topics with corrected duration thresholds
        targets.forEach((topic, index) => {
          const startSeconds = topic.start.split(":").reduce((acc, time) => (60 * acc) + parseFloat(time), 0);
          const endSeconds = topic.end.split(":").reduce((acc, time) => (60 * acc) + parseFloat(time), 0);
          const durationSeconds = endSeconds - startSeconds;

          // < 30s → SKIP (not READY with empty questions!)
          if (durationSeconds < 30) {
            DbService.updateStatus(videoId, topic.topic, "SKIPPED", {
              skipReason: `INSUFFICIENT_DURATION_${Math.round(durationSeconds)}s`
            });
            return;
          }

          // Determine question count: 30-90s=1, 90-300s=2, 300s+=3
          let targetNumQuestions = 1;
          if (durationSeconds >= 30 && durationSeconds < 90) {
            targetNumQuestions = 1;
          } else if (durationSeconds >= 90 && durationSeconds < 300) {
            targetNumQuestions = 2;
          } else {
            targetNumQuestions = 3;
          }

          const promptEstimate = `Generate exactly ${targetNumQuestions} questions for ${topic.topic}... ${topic.transcript}`;
          const estimatedTokens = QuizGenerationService.estimateTokens(promptEstimate) + 500;

          // Transition: -> QUEUED
          DbService.updateStatus(videoId, topic.topic, "QUEUED");

          queueManager.push({
            fn: async () => {
              return await QuizGenerationService.generateQuizForTopic(topic.topic, topic.transcript, targetNumQuestions);
            },
            videoId,
            topic: topic.topic,
            priority: index,
            estimatedTokens,
            resolve: () => {},
            reject: (err) => {
              console.error(`[Quiz Pipeline] Resume job rejected for "${topic.topic}":`, err.message);
            }
          });
        });

        // Start workers
        workerManager.start();
      } catch (err) {
        console.error(`[Quiz Pipeline] Failed to resume quiz job for video ${videoId}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[Quiz Pipeline] Error during resume check:", err.message);
  }
}

// 8. Backward Compatibility Entry Point (Saves list of generated quizzes once resolved)
export async function generateQuizzes(topics) {
  console.log("[Quiz Generator] Generating quizzes using standard compatibility path...");
  const results = [];

  for (const topic of topics) {
    try {
      const prompt = `
You are an expert tutor designing conceptual quizzes to reinforce learning.
Generate multiple-choice quiz question(s) in English for the topic: "${topic.topic}", using ONLY the transcript content provided below.

INSTRUCTIONS FOR DIFFICULTY AND STYLE:
1. Target Difficulty: EASY to MODERATE (70% Easy, 30% Medium). Designed for someone who just watched the lecture for the first time.
   - Do NOT generate advanced, complex, or interview-level questions.
   - Avoid questions requiring complex reasoning, multi-step problem solving, or details outside the transcript.
2. Focus on basic comprehension:
   - Identify the correct statement or syntax, recognize correct usage, or understand the purpose of examples demonstrated in the lecture.
   - Use the instructor's explicit code snippets, diagrams, or examples mentioned in the transcript.
3. Concise Format:
   - Question: 10–20 words.
   - Options: 3–10 words per option.
   - Exactly 4 options (A, B, C, D) with one correct answer.
4. Simple Language: Use beginner-friendly English.

Return valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Short question text in English",
      "options": {
        "A": "Short option text",
        "B": "Short option text",
        "C": "Short option text",
        "D": "Short option text"
      },
      "correctAnswer": "B"
    }
  ]
}

Transcript:
${topic.transcript}
`;

      const response = await retryWithBackoff(async () => {
        return await groq.chat.completions.create({
          model: QUIZ_MODEL,
          temperature: 0,
          max_tokens: EXPECTED_OUTPUT_TOKENS,
          messages: [
            {
              role: "system",
              content: "You are a quiz generator. You must return ONLY raw JSON matching the requested schema. Do NOT wrap the response in markdown code blocks or any other formatting."
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
      });

      const content = response.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(content);
      const questionsList = parsed?.questions || [];

      // Validate questions
      const validQuestions = questionsList.filter(q => validateQuestion(q, topic.topic));

      results.push({
        topic: topic.topic,
        questions: validQuestions
      });
    } catch (err) {
      console.error(`[Quiz Generator] Error on topic "${topic.topic}":`, err.message);
    }
  }

  return results;
}