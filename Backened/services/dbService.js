import IncrementalQuiz from "../Models/IncrementalQuiz.js";

function timeToMs(time) {
  if (typeof time === "number") return time * 1000;
  const parts = String(time || "").split(":").map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  } else if (parts.length === 2) {
    return (parts[0] * 60 + parts[1]) * 1000;
  }
  return Number(time) * 1000 || 0;
}

export class DbService {
  static async initializePendingQuizzes(videoId, topicTranscripts, transcript) {
    const list = [];
    for (const topic of topicTranscripts) {
      const startMs = timeToMs(topic.start);
      const endMs = timeToMs(topic.end);

      const filtered = transcript.filter(item => item.offset >= startMs && item.offset < endMs);
      let startTime = startMs / 1000;
      let endTime = endMs / 1000;

      if (filtered.length > 0) {
        startTime = filtered[0].offset / 1000;
        const last = filtered[filtered.length - 1];
        endTime = (last.offset + (last.duration || 0)) / 1000;
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
          questions: []
        });
        console.log(`[Database Service] Initialized PENDING topic: "${topic.topic}" for video ${videoId}`);
      }
      list.push(existing);
    }
    return list;
  }

  static async updateStatus(videoId, topicName, status, extra = {}) {
    const { questions = [], skipReason = null, failureReason = null } = extra;

    // Defensive Assertions
    if (status === "READY") {
      if (!questions || questions.length === 0) {
        throw new Error(`[Database Service] Assertion Failed: READY status topic "${topicName}" cannot have zero questions.`);
      }
    }
    if (status === "SKIPPED") {
      if (questions && questions.length > 0) {
        throw new Error(`[Database Service] Assertion Failed: SKIPPED status topic "${topicName}" cannot contain questions.`);
      }
    }

    const update = { status };
    if (status === "READY") {
      update.questions = questions;
      update.generatedAt = new Date();
      update.skipReason = null;
      update.failureReason = null;
    } else if (status === "SKIPPED") {
      update.skipReason = skipReason || "GENERIC_SKIP";
      update.questions = [];
      update.failureReason = null;
    } else if (status === "FAILED") {
      update.failureReason = failureReason || "GENERIC_FAILURE";
      update.questions = [];
      update.skipReason = null;
    }

    const doc = await IncrementalQuiz.findOneAndUpdate({ videoId, topic: topicName }, update, { new: true });
    
    // Detailed logs
    console.log(`[Database Service] Transition: Video ${videoId} Topic "${topicName}" -> Status: [${status}]`);
    if (status === "READY") {
      console.log(`  └─ Successfully saved ${questions.length} validated questions to MongoDB.`);
    } else if (status === "SKIPPED") {
      console.log(`  └─ Skipped topic. Reason: ${skipReason}`);
    } else if (status === "FAILED") {
      console.log(`  └─ Generation failed. Reason: ${failureReason}`);
    }
    return doc;
  }

  static async findQuizzesForVideo(videoId) {
    return await IncrementalQuiz.find({ videoId }).sort({ startTime: 1 });
  }

  static async findUnfinishedQuizzes() {
    return await IncrementalQuiz.find({
      status: { $in: ["PENDING", "QUEUED", "GENERATING", "VALIDATING", "SAVING", "FAILED"] }
    });
  }
}
