import Groq from "groq-sdk";
import "../env.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY configured: false");
} else {
  console.log("GROQ_API_KEY configured: true");
}

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

export default groq;