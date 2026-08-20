import { queueManager } from "./queueManager.js";
import { tokenBudgetManager } from "./tokenBudgetManager.js";
import { DbService } from "./dbService.js";

export class WorkerManager {
  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
    this.activeWorkers = 0;
    this.timerId = null;
  }

  start() {
    this.processQueue();
  }

  processQueue() {
    if (tokenBudgetManager.isPaused()) {
      const remaining = tokenBudgetManager.getPauseRemaining();
      console.log(`[Worker Manager] Scheduler is paused. Retrying in ${Math.round(remaining)}ms...`);
      if (this.timerId) clearTimeout(this.timerId);
      this.timerId = setTimeout(() => this.processQueue(), remaining + 100);
      return;
    }

    const len = queueManager.getLength();
    if (len === 0) return;

    // Adaptive Concurrency: scales worker slots based on sliding window token usage
    const currentUsage = tokenBudgetManager.getCurrentUsage();
    let currentLimit = this.maxConcurrency;
    if (currentUsage > tokenBudgetManager.limit * 0.8) {
      currentLimit = 1;
    } else if (currentUsage > tokenBudgetManager.limit * 0.5) {
      currentLimit = 2;
    }

    console.log(`[Worker Manager] Processing Queue. Active: ${this.activeWorkers}/${currentLimit}. Usage: ${currentUsage}/${tokenBudgetManager.limit} TPM. Queue: ${len}`);

    for (let i = 0; i < len; i++) {
      if (this.activeWorkers >= currentLimit) break;

      const task = queueManager.peek();
      if (!task) break;

      const remainingBudget = tokenBudgetManager.getRemainingBudget();
      if (remainingBudget >= task.estimatedTokens) {
        // Pop and run
        queueManager.pop();
        this.activeWorkers++;

        console.log(`[Worker Manager] Dispatching worker for "${task.topic}" (Video: ${task.videoId}). Est tokens: ${task.estimatedTokens}`);

        (async () => {
          try {
            // Transition: QUEUED -> GENERATING
            await DbService.updateStatus(task.videoId, task.topic, "GENERATING");
            tokenBudgetManager.recordTokens(task.estimatedTokens);
            
            const result = await task.fn();

            // Transition: GENERATING -> VALIDATING (logged for tracing)
            await DbService.updateStatus(task.videoId, task.topic, "VALIDATING");

            // result.questions has already been validated and de-duplicated by QuizGenerationService
            const validQuestions = result.questions;

            if (!validQuestions || validQuestions.length === 0) {
              // Transition: VALIDATING -> FAILED
              await DbService.updateStatus(task.videoId, task.topic, "FAILED", {
                failureReason: "ZERO_VALID_QUESTIONS"
              });
              task.reject(new Error("ZERO_VALID_QUESTIONS"));
              return;
            }

            // Transition: VALIDATING -> SAVING
            await DbService.updateStatus(task.videoId, task.topic, "SAVING");

            // Transition: SAVING -> READY (with defensive assertion inside DbService)
            await DbService.updateStatus(task.videoId, task.topic, "READY", {
              questions: validQuestions
            });
            
            task.resolve(result);
          } catch (err) {
            console.error(`[Worker Manager] Job execution failed for "${task.topic}":`, err.message);

            // Only transition to FAILED if not already READY (defensive)
            try {
              await DbService.updateStatus(task.videoId, task.topic, "FAILED", {
                failureReason: err.message || "WORKER_EXECUTION_ERROR"
              });
            } catch (dbErr) {
              console.error(`[Worker Manager] Failed to update FAILED status for "${task.topic}":`, dbErr.message);
            }
            task.reject(err);
          } finally {
            this.activeWorkers--;
            console.log(`[Worker Manager] Worker completed task. Active: ${this.activeWorkers}/${currentLimit}`);
            this.processQueue();
          }
        })();
      } else {
        console.log(`[Worker Manager] Throttling: oldest task "${task.topic}" requires ${task.estimatedTokens} tokens (Remaining budget: ${remainingBudget})`);
        
        // Schedule retry check when the oldest token lease in sliding window expires
        const oldestItem = tokenBudgetManager.history[0];
        if (oldestItem) {
          const timeUntilExpiry = Math.max(100, oldestItem.timestamp + 60000 - Date.now());
          if (this.timerId) clearTimeout(this.timerId);
          this.timerId = setTimeout(() => {
            this.timerId = null;
            this.processQueue();
          }, timeUntilExpiry + 150);
        }
        break; // Keep priority order intact
      }
    }
  }
}

export const workerManager = new WorkerManager(3);
