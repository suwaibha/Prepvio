import { getTranscript as fetchYoutubeTranscript } from "./transcript.js";

export class TranscriptService {
  static async getTranscript(urlOrText) {
    console.log(`[Transcript Service] Fetching transcript...`);
    const transcript = await fetchYoutubeTranscript(urlOrText);
    if (!transcript || transcript.length === 0) {
      throw new Error("Transcript is empty or could not be loaded.");
    }
    return transcript;
  }
}
