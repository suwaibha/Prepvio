import { detectTopics } from "./topicDetector.js";
import { sliceAllTopics } from "../Utils/sliceTranscript.js";

export class TopicSegmentationService {
  static async segmentTranscript(transcript, chunks) {
    console.log(`[Topic Segmentation Service] Detecting learning topics...`);
    const detected = await detectTopics(chunks);
    
    // sliceAllTopics segments the full transcript into sub-transcript strings per topic
    const topicTranscripts = sliceAllTopics(transcript, detected);
    console.log(`[Topic Segmentation Service] Identified ${topicTranscripts.length} valid learning topics.`);
    return topicTranscripts;
  }
}
