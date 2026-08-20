import groq from "./groq.js";
import { buildPromptBatches, prepareTranscriptChunks } from "../Utils/promptLimits.js";

const TOPIC_MODEL = process.env.GROQ_TOPIC_MODEL || "llama-3.1-8b-instant";

export async function detectTopics(chunks) {
  const safeChunks = prepareTranscriptChunks(chunks);
  const batches = buildPromptBatches(safeChunks);

  const allTopics = [];

  for (const batch of batches) {
    const prompt = `
You are a senior curriculum architect and educational content assessor for a premium learning platform (like Coursera or Udemy).
Analyze the following timestamped transcript chunks and segment them into complete, logical educational topic segments.

A valid educational topic segment must satisfy ALL of these criteria:
1. It represents one complete, distinct educational concept taught in the lecture (e.g. "Linked List Insertion", "Variables", "JWT Authentication").
2. It contains actual, structured learning content (LEARNING_CONTENT).
3. It has enough depth, explanation, and material to generate high-quality conceptual questions.
4. It is NOT promotional, casual talk, roadmap walkthroughs, motivational talk, or simple intros/outros (NON_LEARNING_CONTENT).

CRITICAL EXCLUSIONS (Do NOT segment these as learning topics):
- Welcome greetings ("Hello everyone", "Hi guys", channel intros).
- Roadmaps, syllabus overviews, or next video previews.
- Sponsor callouts, advertisements, social media requests (like, share, subscribe).
- Casual stories, generic motivation, administration, farewells, outros.
- Explanations that are very brief (only mentioned in passing without elaboration).

LANGUAGE RULE:
You MUST produce the topic names and classifications in fluent, natural English, translating the concepts if the transcript is in another language.

Return valid JSON in this exact structure:
{
  "topics": [
    {
      "topic": "Clean English Topic Name",
      "start": "00:00:00",
      "end": "00:05:10",
      "classification": "LEARNING_CONTENT"
    }
  ]
}

Transcript:
${JSON.stringify(batch)}
`;

    const response = await groq.chat.completions.create({
      model: TOPIC_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a topic detector. You must return ONLY raw JSON matching the requested schema. Do NOT wrap the response in markdown code blocks or any other formatting."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0].message.content;
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.topics)) {
        // Validate and filter only LEARNING_CONTENT topics
        const validated = parsed.topics.filter(t => 
          t.classification === "LEARNING_CONTENT" &&
          t.topic && 
          t.start && 
          t.end &&
          t.topic.trim().length > 0
        );
        allTopics.push(...validated);
      }
    } catch (err) {
      console.error("[Topic Detector] Failed to parse topic JSON:", err.message);
    }
  }

  return allTopics;
}