import { TranscriptService } from "./transcriptService.js";
import { TopicSegmentationService } from "./topicSegmentationService.js";
import { DbService } from "./dbService.js";
import { queueManager } from "./queueManager.js";
import { workerManager } from "./workerManager.js";
import { QuizGenerationService } from "./quizGenerationService.js";
import { mergeTranscript } from "../Utils/mergeTranscript.js";

// Duration thresholds (in seconds) for question count mapping
const DURATION_RULES = {
  SKIP_BELOW: 30,       // < 30s → SKIP
  TIER_1_MAX: 90,       // 30-90s → 1 question
  TIER_2_MAX: 300,      // 90-300s → 2 questions
  // > 300s → 3 questions (max)
};

function getQuestionCountForDuration(durationSeconds) {
  if (durationSeconds < DURATION_RULES.SKIP_BELOW) return 0;
  if (durationSeconds < DURATION_RULES.TIER_1_MAX) return 1;
  if (durationSeconds < DURATION_RULES.TIER_2_MAX) return 2;
  return 3;
}

function parseTimeToSeconds(timeStr) {
  return timeStr.split(":").reduce((acc, time) => (60 * acc) + parseFloat(time), 0);
}

export async function processVideoQuizzesInBackground(videoId, urlOrText) {
  try {
    console.log(`\n━━━ [Video Processing Pipeline] Starting for Video: ${videoId} ━━━`);
    
    // Step 1: Extract Transcript
    console.log(`[Pipeline] Step 1: Extracting transcript...`);
    const transcript = await TranscriptService.getTranscript(urlOrText);
    console.log(`[Pipeline] Step 1 Complete: Transcript extracted (${transcript.length} chunks).`);

    // Step 2: Segment Educational Topics
    console.log(`[Pipeline] Step 2: Segmenting educational topics...`);
    const chunks = mergeTranscript(transcript);
    const topicTranscripts = await TopicSegmentationService.segmentTranscript(transcript, chunks);
    console.log(`[Pipeline] Step 2 Complete: ${topicTranscripts.length} learning topics identified.`);

    // Step 3: Initialize all topics in DB as PENDING
    console.log(`[Pipeline] Step 3: Initializing PENDING records in MongoDB...`);
    const initializedQuizzes = await DbService.initializePendingQuizzes(videoId, topicTranscripts, transcript);
    console.log(`[Pipeline] Step 3 Complete: ${initializedQuizzes.length} topics initialized.`);

    // Step 4: Evaluate each topic and either SKIP or QUEUE
    console.log(`[Pipeline] Step 4: Evaluating topics and creating background jobs...`);
    let queuedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < topicTranscripts.length; index++) {
      const topic = topicTranscripts[index];
      const startSeconds = parseTimeToSeconds(topic.start);
      const endSeconds = parseTimeToSeconds(topic.end);
      const durationSeconds = endSeconds - startSeconds;

      const targetNumQuestions = getQuestionCountForDuration(durationSeconds);

      if (targetNumQuestions === 0) {
        // SKIP: Topic is too short to generate meaningful questions
        console.log(`[Pipeline] Topic "${topic.topic}" -> SKIPPED (Duration: ${Math.round(durationSeconds)}s < ${DURATION_RULES.SKIP_BELOW}s)`);
        await DbService.updateStatus(videoId, topic.topic, "SKIPPED", {
          skipReason: `INSUFFICIENT_DURATION_${Math.round(durationSeconds)}s`
        });
        skippedCount++;
        continue;
      }

      // Estimate tokens for budget tracking
      const promptEstimate = `Generate exactly ${targetNumQuestions} questions for ${topic.topic}... ${topic.transcript}`;
      const estimatedTokens = QuizGenerationService.estimateTokens(promptEstimate) + 500;

      // Transition: PENDING -> QUEUED
      await DbService.updateStatus(videoId, topic.topic, "QUEUED");

      // Define the job execution function
      const taskFn = async () => {
        return await QuizGenerationService.generateQuizForTopic(topic.topic, topic.transcript, targetNumQuestions);
      };

      // Push job into Queue Manager (chronologically ordered)
      queueManager.push({
        fn: taskFn,
        videoId,
        topic: topic.topic,
        priority: index,
        estimatedTokens,
        resolve: () => {},
        reject: (err) => {
          console.error(`[Pipeline] Background job rejected for "${topic.topic}":`, err.message);
        }
      });

      console.log(`[Pipeline] Topic "${topic.topic}" -> QUEUED (Duration: ${Math.round(durationSeconds)}s, Target Qs: ${targetNumQuestions}, Est Tokens: ${estimatedTokens})`);
      queuedCount++;
    }

    console.log(`[Pipeline] Step 4 Complete: ${queuedCount} topics queued, ${skippedCount} topics skipped.`);

    // Step 5: Start background workers to process jobs in the queue
    console.log(`[Pipeline] Step 5: Starting background worker pool...`);
    workerManager.start();
    
    console.log(`━━━ [Video Processing Pipeline] Successfully initialized for Video: ${videoId} ━━━\n`);
  } catch (err) {
    console.error(`━━━ [Video Processing Pipeline] Initialization FAILED for Video ${videoId}:`, err.message);
  }
}
