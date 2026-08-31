import axios from "axios";
import "../../env.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY configured: false");
} else {
  console.log("GROQ_API_KEY configured: true");
}

/**
 * Extract Q&A pairs from session messages
 * Finds "AI/System" followed by "User/Candidate" response pairs
 */
const extractQAPairs = (messages) => {
  const qaPairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];

    if (
      (current.sender === "AI" || current.sender === "System") &&
      (next.sender === "User" || next.sender === "Candidate")
    ) {
      qaPairs.push({
        question: current.text,
        answer: next.text,
        timestamp: next.time || null,
      });
    }
  }
  return qaPairs;
};

/**
 * Generate AI report using Groq API
 * Analyzes Q&A pairs and generates structured performance report
 */
export const generateAIReport = async (sessionData) => {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in environment variables");
  }

  const {
    messages = [],
    role = "Unknown Role",
    companyType = "Company",
    solvedProblems = [],
  } = sessionData;

  // Extract Q&A pairs from messages
  const qaPairs = extractQAPairs(messages);

  if (qaPairs.length === 0) {
    throw new Error("No Q&A pairs found in interview data");
  }

  // Format interview data for Groq prompt
  const qaText = qaPairs
    .map(
      (pair, idx) =>
        `Q${idx + 1}: ${pair.question}\nA${idx + 1}: ${pair.answer}`
    )
    .join("\n\n");

  const codingProblemsText = solvedProblems
    .map((problem) => `Problem: ${problem.problem?.title || "Unknown"} - Solved: ${!problem.skipped}`)
    .join("\n");

  const prompt = `You are an expert interview evaluator. Analyze this interview and provide a detailed performance report in JSON format.

Interview Role: ${role}
Company Type: ${companyType}

Q&A Pairs:
${qaText}

Coding Problems:
${codingProblemsText || "None"}

Provide a JSON response (NO markdown formatting, pure JSON) with this exact structure:
{
  "topics": [
    {
      "name": "topic_name",
      "totalQuestions": number,
      "strong": number,
      "partial": number,
      "weak": number,
      "weakSubtopics": ["subtopic1", "subtopic2"]
    }
  ],
  "roundSummary": [
    {
      "round": "round_name",
      "topic": "topic_name",
      "subtopic": "subtopic_name",
      "result": "strong|partial|weak",
      "question": "question_text",
      "answer": "candidate_answer",
      "feedback": "specific_improvement_suggestion"
    }
  ],
  "weakAreas": ["area1", "area2"],
  "overallScore": number_0_to_100,
  "metrics": {
    "confidence": number_0_to_100,
    "communication": number_0_to_100,
    "technical": number_0_to_100
  }
}

Analyze and respond ONLY with valid JSON, no markdown or extra text.`;

  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured in environment variables");
    }

    console.log(`Calling Groq API ${GROQ_URL} with key ${maskKey(GROQ_API_KEY)}`);

    const response = await axios.post(
      GROQ_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let reportText = response.data.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    if (reportText.startsWith("```")) {
      reportText = reportText
        .replace(/^```(?:json)?\n/, "")
        .replace(/\n```$/, "");
    }

    // Parse and validate JSON
    const reportData = JSON.parse(reportText);

    // Validate required fields
    if (!reportData.topics || !Array.isArray(reportData.topics)) {
      throw new Error("Invalid report format: missing topics array");
    }

    return reportData;
  } catch (err) {
    // Enhanced error logging for easier diagnosis
    if (err.response) {
      console.error("❌ Groq API Error: HTTP", err.response.status);
      try {
        console.error("Response body:", JSON.stringify(err.response.data));
      } catch (e) {
        console.error("Response body (raw):", err.response.data);
      }
    } else {
      console.error("❌ Groq API Error:", err.message);
    }

    // Provide a clearer error to callers
    const status = err.response?.status;
    const body = err.response?.data;
    const msg = status === 401 ? `Invalid GROQ API Key (received 401)` : `Groq API request failed${status ? `: ${status}` : ""}`;
    const error = new Error(msg);
    error.details = body || err.message;
    throw error;
  }
};

/**
 * Check if report needs regeneration (format validation)
 * Returns true if report is missing required fields
 */
export const shouldRegenerateReport = (reportData) => {
  if (!reportData) return true;

  // Check for required fields indicating old/invalid format
  const requiredTopicFields = ["weakSubtopics"];
  const requiredRoundFields = ["question", "feedback"];
  const requiredMetrics = ["confidence", "communication", "technical"];

  // Validate topics structure
  if (reportData.topics && Array.isArray(reportData.topics)) {
    for (const topic of reportData.topics) {
      for (const field of requiredTopicFields) {
        if (!(field in topic)) return true;
      }
    }
  }

  // Validate round summary structure
  if (reportData.roundSummary && Array.isArray(reportData.roundSummary)) {
    for (const round of reportData.roundSummary) {
      for (const field of requiredRoundFields) {
        if (!(field in round)) return true;
      }
    }
  }

  // Validate metrics structure
  if (reportData.metrics) {
    for (const metric of requiredMetrics) {
      if (!(metric in reportData.metrics)) return true;
    }
  }

  return false;
};
