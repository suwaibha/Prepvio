import fetch from "node-fetch";

// Deepgram requires API key for STT and TTS
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY || "fw_7BzcUEoGttTnGfZhE6dQ96";
const FIREWORKS_MODEL = process.env.FIREWORKS_MODEL || "accounts/fireworks/models/gpt-oss-120b";

export class VoicePipeline {
  constructor(socket) {
    this.socket = socket;
    this.sttSocket = null;
    this.isLLMGenerating = false;
    this.messageHistory = [];
    this.chunkQueue = [];
    this.role = "Full Stack Developer";
    this.companyType = "Tech Startup";
    this.stage = "intro";
    this.systemInstruction = "";
  }

  // Update interview context to ensure voice reasoning matches the typed interview pipeline
  updateContext(data = {}) {
    if (data.role) this.role = data.role;
    if (data.companyType) this.companyType = data.companyType;
    if (data.stage) this.stage = data.stage;
    if (data.systemInstruction) this.systemInstruction = data.systemInstruction;
    if (Array.isArray(data.chatMessages)) {
      this.messageHistory = data.chatMessages
        .filter((m) => m && m.text && typeof m.text === "string" && m.text.trim().length > 0)
        .map((m) => ({
          role: m.sender === "AI" ? "assistant" : "user",
          content: m.text.trim(),
        }));
    } else if (Array.isArray(data.messages)) {
      this.messageHistory = data.messages
        .filter((m) => m && m.content && typeof m.content === "string" && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role || "user",
          content: m.content.trim(),
        }));
    }
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
    if (!userText || !userText.trim()) return;
    this.isLLMGenerating = true;

    // Reset and cleanup the Deepgram STT socket session, closing connection resources
    this.cleanup();

    this.messageHistory.push({ role: "user", content: userText.trim() });

    const systemPrompt = this.systemInstruction ||
      `You are Sira, a professional AI interviewer conducting the ${this.stage.toUpperCase()} round for a ${this.role} position at ${this.companyType}. Evaluate the candidate's answer and ask an appropriate, concise follow-up question.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...this.messageHistory
    ];

    try {
      const apiKey = process.env.FIREWORKS_API_KEY || FIREWORKS_API_KEY;
      const model = process.env.FIREWORKS_MODEL || FIREWORKS_MODEL;

      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Voice LLM Error HTTP ${response.status}:`, errText.slice(0, 100));
        this.socket.emit("llm_error", { message: "AI response temporarily unavailable" });
        return;
      }

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
              const token = data.choices?.[0]?.delta?.content || "";
              if (token) {
                fullReply += token;
                sentenceBuffer += token;

                // Emit tokens to frontend so UI can type them out instantly
                this.socket.emit("llm_token", token);

                // Basic sentence boundary detection to trigger TTS chunks
                if (/[.!?]\s/.test(sentenceBuffer)) {
                  this.triggerTTS(sentenceBuffer.trim());
                  sentenceBuffer = "";
                }
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

      if (fullReply.trim()) {
        this.messageHistory.push({ role: "assistant", content: fullReply.trim() });
        this.socket.emit("llm_complete", fullReply.trim());
      } else {
        console.warn("Voice LLM generated empty response");
        this.socket.emit("llm_error", { message: "Empty AI response" });
      }

    } catch (e) {
      console.error("LLM Error:", e.message);
      this.socket.emit("llm_error", { message: "Voice AI error" });
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
