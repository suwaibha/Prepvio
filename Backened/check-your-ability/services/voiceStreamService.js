import fetch from "node-fetch";

// Deepgram requires API key for STT and TTS
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";
const FIREWORKS_API_KEY = "fw_7BzcUEoGttTnGfZhE6dQ96"; // Extracted from interviewController.js

export class VoicePipeline {
  constructor(socket) {
    this.socket = socket;
    this.sttSocket = null;
    this.isLLMGenerating = false;
    this.messageHistory = [];
    this.chunkQueue = [];
  }

  // 1. Initialize Deepgram Streaming STT
  initSTT() {
    this.cleanup();

    if (!DEEPGRAM_API_KEY) {
      console.warn("⚠️ DEEPGRAM_API_KEY not found. Streaming STT will not work.");
      return;
    }

    // Deepgram streaming WebSocket - expect WebM chunks from browser's MediaRecorder
    // Upgraded model to nova-2 and enabled smart_format for improved accuracy.
    const dgUrl = "wss://api.deepgram.com/v1/listen?endpointing=300&interim_results=true&model=nova-2&smart_format=true";

    import('ws').then(({ default: WebSocket }) => {
      this.sttSocket = new WebSocket(dgUrl, {
        headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` }
      });

      this.sttSocket.on("open", () => {
        console.log("🎤 Connected to Deepgram STT (Nova-2)");
        // Flush any queued audio chunks
        if (this.chunkQueue && this.chunkQueue.length > 0) {
          console.log(`Sending ${this.chunkQueue.length} queued chunks to Deepgram STT`);
          for (const chunk of this.chunkQueue) {
            if (this.sttSocket && this.sttSocket.readyState === 1) {
              this.sttSocket.send(chunk);
            }
          }
          this.chunkQueue = [];
        }
      });

      this.sttSocket.on("message", (data) => {
        try {
          const res = JSON.parse(data);
          const transcript = res.channel?.alternatives?.[0]?.transcript || "";

          if (transcript) {
            // Send interim results to frontend for UI display
            this.socket.emit("stt_interim", transcript);

            // If the user has finished their turn (endpointing triggered or speech_final)
            if (res.speech_final || res.is_final) {
              this.socket.emit("stt_final", transcript);
              this.triggerLLM(transcript);
            }
          }
        } catch (e) {
          console.error("Deepgram message error", e);
        }
      });

      this.sttSocket.on("close", () => console.log("Deepgram STT closed"));
      this.sttSocket.on("error", (e) => console.error("Deepgram STT error", e));
    });
  }

  // 2. Receive raw audio from Frontend
  processAudioInput(chunk) {
    // If not connected to Deepgram or if socket is closed, initialize it lazily
    if (!this.sttSocket || this.sttSocket.readyState === 3) { // 3 = CLOSED
      this.initSTT();
    }

    if (this.sttSocket) {
      if (this.sttSocket.readyState === 1) { // WebSocket.OPEN
        this.sttSocket.send(chunk);
      } else if (this.sttSocket.readyState === 0) { // WebSocket.CONNECTING
        // Queue the chunks until the socket connection is open
        if (!this.chunkQueue) this.chunkQueue = [];
        this.chunkQueue.push(chunk);
      }
    }
  }

  // Handle explicit TTS requests (e.g. initial greeting)
  processTTSRequest(text) {
    this.triggerTTS(text);
  }

  // 3. Trigger LLM (Streaming)
  async triggerLLM(userText) {
    if (this.isLLMGenerating) return;
    this.isLLMGenerating = true;

    // Reset and cleanup the Deepgram STT socket session, closing connection resources
    this.cleanup();

    this.messageHistory.push({ role: "user", content: userText });

    const messages = [
      { role: "system", content: "You are a professional interviewer. Keep your answers brief (1-3 sentences) and conversational." },
      ...this.messageHistory
    ];

    try {
      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "accounts/fireworks/models/deepseek-v4-pro",
          messages,
          stream: true
        })
      });

      let fullReply = "";
      let sentenceBuffer = "";

      // Manually process the streaming response chunks
      for await (const chunk of response.body) {
        const lines = chunk.toString().split("\n").filter(l => l.trim() !== "");
        for (const line of lines) {
          if (line === "data: [DONE]") break;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const token = data.choices[0]?.delta?.content || "";
              fullReply += token;
              sentenceBuffer += token;

              // Emit tokens to frontend so UI can type them out instantly
              this.socket.emit("llm_token", token);

              // Basic sentence boundary detection to trigger TTS chunks
              if (/[.!?]\s/.test(sentenceBuffer)) {
                this.triggerTTS(sentenceBuffer.trim());
                sentenceBuffer = "";
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }

      // Flush remaining buffer
      if (sentenceBuffer.trim()) {
        this.triggerTTS(sentenceBuffer.trim());
      }

      this.messageHistory.push({ role: "assistant", content: fullReply });
      this.socket.emit("llm_complete", fullReply);

    } catch (e) {
      console.error("LLM Error:", e);
    } finally {
      this.isLLMGenerating = false;
    }
  }

  // 4. Trigger TTS (Streaming)
  async triggerTTS(text) {
    if (!text || !DEEPGRAM_API_KEY) return;

    // Using Deepgram Aura for extremely fast TTS (could also use Cartesia/ElevenLabs)
    try {
      const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
        method: "POST",
        headers: {
          "Authorization": `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      // Wait for the full audio buffer of this sentence
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Emit the complete sentence audio along with its text to the frontend
      this.socket.emit("tts_audio_chunk", { audio: buffer, text });

    } catch (e) {
      console.error("TTS Error:", e);
    }
  }

  cleanup() {
    if (this.sttSocket) {
      try {
        this.sttSocket.close();
      } catch (err) {
        console.error("Error closing STT socket:", err.message);
      }
      this.sttSocket = null;
    }
    this.chunkQueue = [];
  }
}
