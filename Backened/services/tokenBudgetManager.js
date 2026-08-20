class TokenBudgetManager {
  constructor(maxTpm = 6000, safetyBuffer = 600) {
    this.limit = maxTpm - safetyBuffer; // Safety ceiling (e.g. 5400 TPM)
    this.history = []; // Array of { timestamp, tokens }
    this.pausedUntil = 0;
  }

  cleanHistory() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.history = this.history.filter(item => item.timestamp > oneMinuteAgo);
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
    console.log(`[Token Budget Manager] Logged ${tokens} tokens. Current usage: ${this.getCurrentUsage()} / ${this.limit} TPM`);
  }

  pause(durationMs) {
    this.pausedUntil = Date.now() + durationMs;
    console.log(`[Rate Limit Manager] Scheduler paused for ${Math.round(durationMs)}ms.`);
  }

  isPaused() {
    return Date.now() < this.pausedUntil;
  }

  getPauseRemaining() {
    return Math.max(0, this.pausedUntil - Date.now());
  }
}

export const tokenBudgetManager = new TokenBudgetManager(6000, 600);
