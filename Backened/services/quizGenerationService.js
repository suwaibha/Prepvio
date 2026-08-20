import groq from "./groq.js";
import { tokenBudgetManager } from "./tokenBudgetManager.js";
import { validateQuestion } from "./quizGenerator.js";
import { groqRequestCoordinator } from "./groqRequestCoordinator.js";

const QUIZ_MODEL = process.env.GROQ_QUIZ_MODEL || "llama-3.1-8b-instant";

export class QuizGenerationService {
  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  static async generateQuizForTopic(topicName, transcript, targetNumQuestions) {
    console.log(`[Quiz Generation Service] Generating ${targetNumQuestions} question(s) for topic: "${topicName}"...`);

    const prompt = `
You are an expert tutor designing conceptual quizzes to reinforce learning.
Generate exactly ${targetNumQuestions} simple, straightforward multiple-choice quiz question(s) in English for the topic: "${topicName}", using ONLY the transcript content provided below.

INSTRUCTIONS FOR DIFFICULTY AND STYLE:
1. Target Difficulty: EASY to MODERATE (70% Easy, 30% Medium). Designed for someone who just watched the lecture for the first time.
   - Do NOT generate advanced, complex, or interview-level questions.
   - Avoid questions requiring complex reasoning, multi-step problem solving, or details outside the transcript.
2. Focus on basic comprehension:
   - Identify the correct statement or syntax, recognize correct usage, or understand the purpose of examples demonstrated in the lecture.
   - Use the instructor's explicit code snippets, diagrams, or examples mentioned in the transcript.
3. Concise Format:
   - Question: 10–20 words.
   - Options: 3–10 words per option.
   - Exactly 4 options (A, B, C, D) with one correct answer.
4. Simple Language: Use beginner-friendly English.

Return valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Short question text in English",
      "options": {
        "A": "Short option text",
        "B": "Short option text",
        "C": "Short option text",
        "D": "Short option text"
      },
      "correctAnswer": "B"
    }
  ]
}

Transcript:
${transcript}
`;

    const inputTokens = this.estimateTokens(prompt);
    const expectedOutputTokens = 500;
    const estimatedTotal = inputTokens + expectedOutputTokens;

    const executeCall = async () => {
      let attempt = 1;
      const maxRetries = 5;

      while (attempt <= maxRetries) {
        try {
          return await groqRequestCoordinator.schedule(() => groq.chat.completions.create({
            model: QUIZ_MODEL,
            temperature: 0,
            max_tokens: expectedOutputTokens,
            messages: [
              {
                role: "system",
                content: "You are a quiz generator. You must return ONLY raw JSON matching the requested schema. Do NOT wrap the response in markdown code blocks or any other formatting."
              },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          }), estimatedTotal, `quiz:${topicName}`);
        } catch (error) {
          const isRateLimit = error.status === 429 || 
                              error.status === 413 ||
                              error.message?.includes("rate_limit_exceeded") || 
                              error.message?.includes("Rate limit reached") ||
                              error.status >= 500;

          if (!isRateLimit || attempt === maxRetries) {
            throw error;
          }

          let waitTimeMs = Math.pow(2, attempt - 1) * 1000 + (Math.random() * 500);
          const retryHeader = error.headers?.['retry-after'] || error.response?.headers?.['retry-after'];
          if (retryHeader) {
            const seconds = parseFloat(retryHeader);
            if (!isNaN(seconds)) {
              waitTimeMs = (seconds * 1000) + 200;
            }
          } else {
            const match = error.message?.match(/try again in ([\d\.]+)s/i);
            if (match) {
              waitTimeMs = (parseFloat(match[1]) * 1000) + 200;
            }
          }

          console.warn(`[Quiz Generation Service] Rate limit hit (attempt ${attempt}/${maxRetries}). Pausing for ${Math.round(waitTimeMs)}ms...`);
          tokenBudgetManager.pause(waitTimeMs);
          await new Promise(resolve => setTimeout(resolve, waitTimeMs));
          attempt++;
        }
      }
    };

    const response = await executeCall();
    const content = response.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    const questionsList = parsed?.questions || [];

    console.log(`[Quiz Generation Service] AI returned ${questionsList.length} question(s) for topic "${topicName}".`);

    // Validate each question using the scoring validator
    const validQuestions = [];
    let rejectedCount = 0;
    for (const q of questionsList) {
      if (validateQuestion(q, topicName)) {
        validQuestions.push(q);
      } else {
        rejectedCount++;
      }
    }

    console.log(`[Quiz Generation Service] Validation result for "${topicName}": ${validQuestions.length} accepted, ${rejectedCount} rejected.`);

    // De-duplicate questions
    const uniqueQuestions = [];
    const seenTexts = new Set();
    for (const q of validQuestions) {
      const normText = q.question.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      if (!seenTexts.has(normText)) {
        seenTexts.add(normText);
        uniqueQuestions.push(q);
      } else {
        console.warn(`[Quiz Generation Service] Filtered duplicate question for "${topicName}": "${q.question}"`);
      }
    }

    console.log(`[Quiz Generation Service] Final output for "${topicName}": ${uniqueQuestions.length} unique validated question(s).`);

    return {
      questions: uniqueQuestions,
      tokensUsed: estimatedTotal
    };
  }
}
