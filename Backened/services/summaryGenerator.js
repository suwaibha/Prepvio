import groq from "./groq.js";
import crypto from "crypto";
import { groqRequestCoordinator } from "./groqRequestCoordinator.js";

// Configurable constants for model selection
const MODEL_NAME = process.env.GROQ_SUMMARY_MODEL || "openai/gpt-oss-120b";
const CHUNK_MODEL_NAME = process.env.GROQ_CHUNK_MODEL || "openai/gpt-oss-120b";

const MAX_RETRIES = 5;

// Multi-Level Caches
const activePromises = new Map();         // Active inflight generation promises (Deduplication)
const recentSummaryCache = new Map();     // In-memory cache for recently completed summaries
const chunkCache = new Map();             // Cache of summarized transcript chunks (key: MD5 hash)

// Performance Profiler class to measure latency and queue delays
class PerformanceProfiler {
  constructor() {
    this.startTimes = {};
    this.durations = {};
  }

  start(label) {
    this.startTimes[label] = Date.now();
  }

  stop(label) {
    if (this.startTimes[label]) {
      this.durations[label] = Date.now() - this.startTimes[label];
    }
  }

  getDuration(label) {
    return this.durations[label] || 0;
  }

  getReport() {
    return Object.entries(this.durations)
      .map(([label, duration]) => `  - ${label}: ${(duration / 1000).toFixed(2)}s`)
      .join("\n");
  }
}

// Estimates tokens based on average English text metrics (1 word ~ 1.33 tokens)
function estimateTokens(text) {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.33);
}

// Call Groq with exponential backoff, jitter, and Retry-After parsing
async function callGroqWithRetry(params, estimatedTokens, attempt = 1) {
  try {
    return await groqRequestCoordinator.schedule(
      () => groq.chat.completions.create(params),
      estimatedTokens,
      `summary:${params.model}`
    );
  } catch (error) {
    const isRateLimit = error.status === 429 || 
                        error.message?.includes("rate_limit_exceeded") || 
                        error.message?.includes("Rate limit reached") ||
                        error.message?.includes("429");

    if (isRateLimit && attempt <= MAX_RETRIES) {
      // Exponential backoff with random jitter (prevents simultaneous collisions)
      const backoffBase = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000;
      let waitTimeMs = backoffBase + jitter;

      // Check Retry-After header
      const retryAfterHeader = error.headers?.['retry-after'] || error.response?.headers?.['retry-after'];
      if (retryAfterHeader) {
        const seconds = parseFloat(retryAfterHeader);
        if (!isNaN(seconds)) {
          waitTimeMs = (seconds * 1000) + 200;
        }
      } else {
        // Parse from error message (e.g., "try again in 22.4s")
        const match = error.message?.match(/try again in ([\d\.]+)s/i);
        if (match) {
          waitTimeMs = (parseFloat(match[1]) * 1000) + 200;
        }
      }

      // Stop retrying if wait time exceeds 45s (safety ceiling)
      if (waitTimeMs > 45000) {
        console.log(`[Summary Generator] Aborting retry: Required backoff of ${Math.round(waitTimeMs)}ms exceeds safety ceiling (45s).`);
        throw error;
      }

      console.log(`[Summary Generator] Retrying after 429 (Attempt ${attempt}/${MAX_RETRIES}) in ${Math.round(waitTimeMs)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      
      return callGroqWithRetry(params, estimatedTokens, attempt + 1);
    }

    throw error;
  }
}

// Token-based chunking strategy
function chunkTranscriptByTokenCount(transcript, maxTokensPerChunk) {
  const chunks = [];
  let currentChunk = [];
  let currentTokenCount = 0;

  for (const item of transcript) {
    const text = item.text || "";
    const tokens = estimateTokens(text);

    if (currentTokenCount + tokens > maxTokensPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentTokenCount = 0;
    }

    currentChunk.push(item);
    currentTokenCount += tokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Individual chunk summarizer with intermediate caching and token budget enforcement
async function summarizeChunk(chunk, index, totalChunks, profiler, onProgress) {
  const text = Array.isArray(chunk)
    ? chunk.map((item) => item.text).filter(Boolean).join("\n")
    : String(chunk || "");

  if (!text.trim()) {
    return "";
  }

  // Chunk Cache Lookup (Prevent duplicate summarizations of identical sections)
  const chunkHash = crypto.createHash("md5").update(text).digest("hex");
  if (chunkCache.has(chunkHash)) {
    console.log(`[Summary Generator] Chunk ${index + 1}/${totalChunks} Cache Hit. Reusing summary.`);
    return chunkCache.get(chunkHash);
  }

  console.log(`[Summary Generator] Chunk ${index + 1}/${totalChunks} started...`);
  profiler.start(`Chunk_${index + 1}`);

  // Token-Optimized Chunk Prompt to minimize input size
  const systemPrompt = `You are a teaching assistant summarizing a lecture segment in fluent English. Write a conversational flow of the key explanations, reasoning, analogies, comparisons, and examples in this segment. Keep it under 150 words. Do NOT translate technical code tokens (syntax, functions, variables, APIs, tags, commands). If input is in another language, translate to English. Return only the summary.`;

  const inputTokens = estimateTokens(systemPrompt) + estimateTokens(text);
  const maxOutputTokens = 250;

  const response = await callGroqWithRetry({
    model: CHUNK_MODEL_NAME,
    temperature: 0.3,
    max_tokens: maxOutputTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
  }, inputTokens + maxOutputTokens);

  const summary = response.choices?.[0]?.message?.content?.trim() || "";
  profiler.stop(`Chunk_${index + 1}`);
  console.log(`[Summary Generator] Chunk completed. Duration: ${(profiler.getDuration(`Chunk_${index + 1}`) / 1000).toFixed(2)}s`);

  if (summary) {
    chunkCache.set(chunkHash, summary);
    // Maintain a maximum chunk cache size of 500 items to avoid infinite memory bloat
    if (chunkCache.size > 500) {
      const firstKey = chunkCache.keys().next().value;
      chunkCache.delete(firstKey);
    }
  }

  onProgress?.({ type: "chunk", completed: index + 1, total: totalChunks, partialSummary: summary });

  return summary;
}

// Recursively merges summaries in groups of 3 to handle extremely large files cleanly
async function mergeSummariesGroup(summaries, profiler) {
  if (summaries.length <= 6) {
    return summaries;
  }

  console.log(`[Summary Generator] Merging ${summaries.length} intermediate summaries to reduce aggregation load...`);
  profiler.start("MergeSummariesGroup");
  const mergeJobs = [];
  for (let i = 0; i < summaries.length; i += 3) {
    const slice = summaries.slice(i, i + 3);
    if (slice.length === 1) {
      mergeJobs.push(Promise.resolve(slice[0]));
      continue;
    }

    const combinedSliceText = slice.join("\n\n");
    const systemPrompt = `You are a teaching assistant combining consecutive segment summaries in fluent English. Write a unified, flowing explanation under 300 words. Return only the summary.`;

    const inputTokens = estimateTokens(systemPrompt) + estimateTokens(combinedSliceText);
    const maxOutputTokens = 400;

    mergeJobs.push(callGroqWithRetry({
      model: CHUNK_MODEL_NAME,
      temperature: 0.3,
      max_tokens: maxOutputTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: combinedSliceText }
      ]
    }, inputTokens + maxOutputTokens).then((response) => response.choices?.[0]?.message?.content?.trim() || ""));
  }

  const merged = (await Promise.all(mergeJobs)).filter(Boolean);

  profiler.stop("MergeSummariesGroup");
  return mergeSummariesGroup(merged, profiler); // Recurse until we are <= 6 summaries
}

// Inner execution pipeline (unwrapped from promise cache logic)
async function executePipeline(transcript, fullText, profiler, onProgress) {
  const estimatedTotalTokens = estimateTokens(fullText);
  console.log(`[Summary Generator] Estimated tokens: ${estimatedTotalTokens}`);

  // Token-Optimized instructions containing strict styling, translation, and code-preservation rules
  const systemInstructions = `You are an expert instructor writing study notes from a lecture. Write a comprehensive summary structured like a well-written textbook chapter.

Language Constraint:
- Translate any input language (Hindi, Tamil, Arabic, Spanish, Hinglish, etc.) to 100% fluent, natural English.
- The output MUST be 100% English. If the speaker uses idioms or culturally specific expressions, translate their meaning to English.

Do NOT Translate:
- Keep these exactly as they appear: programming languages, HTML tags, CSS properties, JavaScript/SQL syntax, code snippets, APIs, libraries, frameworks, function/class/variable/file names, URLs, commands, and shortcuts. Do not modify or translate them, but explain them in English.

Summary Style Rules:
- Do NOT generate revision notes, cheat sheets, bullet-point notes, or keyword summaries.
- Write the summary as if you are the instructor explaining the topic to a student who missed the lecture.
- Follow the exact flow of the lecture/video from start to finish. Explain why before how.
- Preserve reasoning, examples, analogies, and comparisons.
- Convert demonstrations into descriptive explanations.
- Write in paragraph form. Use H2 (##) for major sections and H3 (###) for subtopics.
- End each major section with a short "Key Takeaway" in 2-3 sentences.

Code Extraction Rules:
1. Extract every meaningful code example and preserve code exactly. Use proper Markdown code blocks.
2. After every code snippet explain: What the code does, why it is written this way, and how it works.
3. If code is edited or evolves, show the final version and explain why changes were made.
4. Embed code naturally within the explanation instead of dumping it at the end.
5. If the transcript contains spoken code, include it. If code can be inferred with very high confidence, reconstruct it. Otherwise, state that code was demonstrated visually and cannot be reproduced exactly from the transcript.

Return only the final formatted textbook-style chapter in English.`;

  // === STRATEGY 1: Short transcripts (< 3000 tokens) -> Single Request ===
  if (estimatedTotalTokens < 3000) {
    console.log("[Summary Generator] Strategy selected: Single request");
    profiler.start("SingleSummarization");
    
    const inputTokens = estimateTokens(systemInstructions) + estimatedTotalTokens;
    const maxOutputTokens = 1200;

    const response = await callGroqWithRetry({
      model: MODEL_NAME,
      temperature: 0.3,
      max_tokens: maxOutputTokens,
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: fullText },
      ],
    }, inputTokens + maxOutputTokens);

    const finalSummary = response.choices?.[0]?.message?.content?.trim() || "";
    profiler.stop("SingleSummarization");
    return finalSummary;
  }

  // === STRATEGY 2: Medium/Large transcripts -> Adaptive Chunking ===
  // Calculate dynamic token limit per chunk based on current TPM usage to avoid triggering 429s
  const currentTPM = groqRequestCoordinator.currentTpm();
  const remainingTPM = Math.max(0, Number(process.env.GROQ_TPM_LIMIT || 6800) - currentTPM);
  
  // Optimal default target chunk size is 1,200 to 1,500 tokens (around 1000 words).
  // This keeps request size (~1,700 tokens) below 22% of Groq's 8000 TPM, letting us schedule chunks without hitting limits.
  let maxTokensPerChunk = 1500;
  let strategyLabel = "Hierarchical (Medium)";
  
  if (remainingTPM < 3000) {
    maxTokensPerChunk = 1000; // Shrink chunks to stay token-safe when TPM is tight
    strategyLabel = "Hierarchical (Low TPM Adaptive)";
  } else if (estimatedTotalTokens >= 30000) {
    maxTokensPerChunk = 2000; // Slightly larger chunks for extremely long videos if TPM is clear
    strategyLabel = "Multi-level (Extremely Large)";
  }

  console.log(`[Summary Generator] Strategy selected: ${strategyLabel} (max ${maxTokensPerChunk} tokens per chunk)`);
  
  profiler.start("ChunkCreation");
  const chunks = chunkTranscriptByTokenCount(transcript, maxTokensPerChunk);
  profiler.stop("ChunkCreation");
  
  console.log(`[Summary Generator] Split transcript into ${chunks.length} chunks.`);

  let summaries = [];
  profiler.start("ChunkSummarizationAll");
  onProgress?.({ type: "stage", stage: "chunking", completed: 0, total: chunks.length });
  const chunkResults = await Promise.all(chunks.map((chunk, index) =>
    summarizeChunk(chunk, index, chunks.length, profiler, onProgress)
  ));
  summaries = chunkResults.filter(Boolean);
  profiler.stop("ChunkSummarizationAll");

  if (!summaries.length) {
    throw new Error("Unable to generate segment summaries");
  }

  // Multi-Level merge processing for very large chunk arrays
  if (summaries.length > 6) {
    summaries = await mergeSummariesGroup(summaries, profiler);
  }

  // Combine intermediate summaries into the final structured chapter format
  console.log(`[Summary Generator] Combining summaries...`);
  onProgress?.({ type: "stage", stage: "finalizing" });
  profiler.start("FinalAggregation");

  const combinedText = summaries.join("\n\n");
  const combineInputTokens = estimateTokens(systemInstructions) + estimateTokens(combinedText);
  const combineMaxOutputTokens = 1500;

  const response = await callGroqWithRetry({
    model: MODEL_NAME,
    temperature: 0.3,
    max_tokens: combineMaxOutputTokens,
    messages: [
      { role: "system", content: systemInstructions },
      { role: "user", content: combinedText },
    ],
  }, combineInputTokens + combineMaxOutputTokens);

  const finalSummary = response.choices?.[0]?.message?.content?.trim() || "";
  profiler.stop("FinalAggregation");
  return finalSummary;
}

// Main summary generator pipeline with full in-flight active promise caching
export async function generateSummary(transcript, videoId, onProgress) {
  const fullText = Array.isArray(transcript)
    ? transcript.map((item) => item.text).filter(Boolean).join("\n")
    : String(transcript || "");

  if (!fullText.trim()) {
    throw new Error("Transcript not available");
  }

  // Generate unique key using videoId or an MD5 hash of transcript text
  const key = videoId || crypto.createHash("md5").update(fullText).digest("hex");

  // Level 1 memory cache lookup
  if (recentSummaryCache.has(key)) {
    console.log(`[Summary Generator] Returning cached summary.`);
    return recentSummaryCache.get(key);
  }

  // Active Promise Cache lookup (Inflight request deduplication)
  if (activePromises.has(key)) {
    console.log(`[Summary Generator] Summary already in progress... Reusing existing promise...`);
    const active = activePromises.get(key);
    if (onProgress) active.listeners.add(onProgress);
    return active.promise;
  }

  console.log(`[Summary Generator] Starting new summary... key: ${key}`);
  const profiler = new PerformanceProfiler();
  profiler.start("TotalExecutionTime");
  const listeners = new Set(onProgress ? [onProgress] : []);

  const promise = (async () => {
    try {
      const summary = await executePipeline(transcript, fullText, profiler, (event) => {
        for (const listener of listeners) listener(event);
      });
      if (summary) {
        recentSummaryCache.set(key, summary);
        // Clean old items from memory cache to avoid growth beyond 100 entries
        if (recentSummaryCache.size > 100) {
          const oldestKey = recentSummaryCache.keys().next().value;
          recentSummaryCache.delete(oldestKey);
        }
      }
      profiler.stop("TotalExecutionTime");

      // Print final performance profiling report
      console.log(`\n======================================================`);
      console.log(`[Summary Generator] PERFORMANCE REPORT FOR KEY: ${key}`);
      console.log(`======================================================`);
      console.log(profiler.getReport());
      console.log(`  - TotalExecutionTime: ${(profiler.getDuration("TotalExecutionTime") / 1000).toFixed(2)}s`);
      console.log(`  - Estimated Input Token Usage: ${estimateTokens(fullText)} tokens`);
      console.log(`======================================================\n`);

      return summary;
    } catch (error) {
      console.error(`[Summary Generator] Error during generation for key ${key}:`, error);
      throw error;
    } finally {
      // Clean active promise cache so future requests can regenerate if this errored
      activePromises.delete(key);
      console.log(`[Summary Generator] Promise removed.`);
    }
  })();

  activePromises.set(key, { promise, listeners });
  return promise;
}
