import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";
console.log("DEEPGRAM_API_KEY length:", DEEPGRAM_API_KEY ? DEEPGRAM_API_KEY.length : 0);

const dgUrl = "wss://api.deepgram.com/v1/listen?endpointing=300&interim_results=true";
console.log("Connecting to:", dgUrl);

const sttSocket = new WebSocket(dgUrl, {
  headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` }
});

sttSocket.on("open", () => {
  console.log("🟢 Deepgram Connected Successfully!");
  sttSocket.close();
  process.exit(0);
});

sttSocket.on("error", (err) => {
  console.error("❌ Deepgram Error:", err);
  process.exit(1);
});

sttSocket.on("close", (code, reason) => {
  console.log(`🔴 Deepgram Closed. Code: ${code}, Reason: ${reason}`);
});
