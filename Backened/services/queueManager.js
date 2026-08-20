export class QueueManager {
  constructor() {
    this.queue = []; // Array of tasks: { fn, videoId, topic, priority, estimatedTokens, resolve, reject }
  }

  push(task) {
    this.queue.push(task);
    // Chronological order: lower priority index means earlier topic, which has higher execution priority
    this.queue.sort((a, b) => a.priority - b.priority);
    console.log(`[Queue Manager] Task pushed: "${task.topic}" (Priority: ${task.priority}). Queue size: ${this.queue.length}`);
  }

  pop() {
    return this.queue.shift();
  }

  peek() {
    return this.queue[0];
  }

  remove(task) {
    const idx = this.queue.indexOf(task);
    if (idx > -1) {
      this.queue.splice(idx, 1);
    }
  }

  getLength() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

export const queueManager = new QueueManager();
