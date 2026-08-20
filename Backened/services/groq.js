import Groq from "groq-sdk";
import "../env.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function maskKey(key) {
  if (!key) return null;
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY is not set in environment variables");
} else {
  console.log(`GROQ_API_KEY loaded: ${maskKey(GROQ_API_KEY)}`);
}

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

export default groq;