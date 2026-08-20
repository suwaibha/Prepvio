// One process-wide admission controller for every Groq request.  Concurrency alone
// is not a TPM limiter: requests are admitted only when their full estimated token
// reservation fits inside the rolling one-minute budget.
const TPM_LIMIT = Number(process.env.GROQ_TPM_LIMIT || 6800);
const MAX_CONCURRENCY = Number(process.env.GROQ_MAX_CONCURRENCY || 3);

class GroqRequestCoordinator {
  constructor() {
    this.history = [];
    this.queue = [];
    this.inFlight = 0;
    this.wakeTimer = null;
  }

  cleanHistory() {
    const cutoff = Date.now() - 60_000;
    this.history = this.history.filter((entry) => entry.timestamp > cutoff);
  }

  currentTpm() {
    this.cleanHistory();
    return this.history.reduce((total, entry) => total + entry.tokens, 0);
  }

  schedule(fn, estimatedTokens, label = "Groq request") {
    if (estimatedTokens > TPM_LIMIT) {
      return Promise.reject(new Error(`${label} needs ${estimatedTokens} tokens, above the configured ${TPM_LIMIT} TPM ceiling`));
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ fn, estimatedTokens, label, resolve, reject });
      this.drain();
    });
  }

  drain() {
    this.cleanHistory();
    while (this.inFlight < MAX_CONCURRENCY && this.queue.length > 0) {
      const next = this.queue[0];
      const used = this.currentTpm();
      if (used + next.estimatedTokens > TPM_LIMIT) {
        this.armWakeUp();
        return;
      }

      this.queue.shift();
      this.history.push({ timestamp: Date.now(), tokens: next.estimatedTokens });
      this.inFlight++;
      console.log(`[Groq Coordinator] Starting ${next.label}. In flight ${this.inFlight}/${MAX_CONCURRENCY}; reserved ${used + next.estimatedTokens}/${TPM_LIMIT} TPM.`);

      Promise.resolve()
        .then(next.fn)
        .then(next.resolve, next.reject)
        .finally(() => {
          this.inFlight--;
          this.drain();
        });
    }
  }

  armWakeUp() {
    if (this.wakeTimer || this.history.length === 0) return;
    const delay = Math.max(50, this.history[0].timestamp + 60_000 - Date.now() + 25);
    console.log(`[Groq Coordinator] TPM budget full; next queued request will be reconsidered in ${Math.ceil(delay / 1000)}s.`);
    this.wakeTimer = setTimeout(() => {
      this.wakeTimer = null;
      this.drain();
    }, delay);
  }
}

export const groqRequestCoordinator = new GroqRequestCoordinator();
