import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function maskKey(key) {
  if (!key) return null;
  if (key.length <= 8) return '****';
  return `${key.slice(0,4)}...${key.slice(-4)}`;
}

if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables.');
  process.exit(1);
}

console.log(`Using GROQ_API_KEY: ${maskKey(GROQ_API_KEY)}`);

async function runTest() {
  try {
    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: 'Health check: please respond with ok' }
      ],
      max_tokens: 5,
    };

    const res = await axios.post(GROQ_URL, payload, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log('HTTP', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.error('HTTP', err.response.status);
      try {
        console.error('Body:', JSON.stringify(err.response.data));
      } catch (e) {
        console.error('Body (raw):', err.response.data);
      }
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(2);
  }
}

runTest();
