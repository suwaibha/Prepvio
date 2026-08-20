import { DbService } from "./dbService.js";

export class CacheManager {
  static async getCachedQuizzes(videoId) {
    const existing = await DbService.findQuizzesForVideo(videoId);
    if (existing.length > 0) {
      console.log(`[Cache Manager] Cache hit for video ${videoId}. Found ${existing.length} topics.`);
      return existing;
    }
    console.log(`[Cache Manager] Cache miss for video ${videoId}.`);
    return null;
  }
}
