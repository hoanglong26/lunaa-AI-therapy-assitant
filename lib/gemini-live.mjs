import WebSocket from "ws";

export class GeminiLiveWS {
  constructor(apiKey, systemInstruction, { onAudioChunk, onTextChunk, onTurnComplete }) {
    this.apiKey = apiKey;
    this.systemInstruction = systemInstruction || "You are Lunaa, an empathetic AI.";
    this.onAudioChunk = onAudioChunk;
    this.onTextChunk = onTextChunk;
    this.onTurnComplete = onTurnComplete;
    this.ws = null;
    this.isConnected = false;
    this.setupDone = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        this.isConnected = true;
        this.ws.send(
          JSON.stringify({
            setup: {
              //model: "models/gemini-2.5-flash-native-audio-latest",
              model: "models/gemini-3.1-flash-live-preview",
              systemInstruction: {
                parts: [{ text: this.systemInstruction }]
              },
              generationConfig: {
                responseModalities: ["AUDIO"],
                thinkingConfig: {
                  thinking_level: "minimal"
                },
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Aoede" }
                  }
                }
              }
            }
          })
        );
      });

      this.ws.on("message", (data) => {
        try {
          const resp = JSON.parse(data.toString());

          if (resp.setupComplete) {
            this.setupDone = true;
            console.log("[GEMINI] setupComplete ✅");

            // Wake-up: gửi lời chào để Gemini bắt đầu nói ngay
            this.ws.send(JSON.stringify({
              realtimeInput: {
                text: "Hãy chào tôi ngắn gọn để bắt đầu cuộc trò chuyện."
              }
            }));

            resolve();
            return;
          }

          if (resp.serverContent?.modelTurn?.parts) {
            for (const p of resp.serverContent.modelTurn.parts) {
              // Forward native audio PCM directly
              if (p.inlineData?.data && this.onAudioChunk) {
                const pcmBuffer = Buffer.from(p.inlineData.data, "base64");
                this.onAudioChunk(pcmBuffer);
              }
              // Forward text (thoughts) for display
              if (p.text && !p.thought && this.onTextChunk) {
                this.onTextChunk(p.text);
              }
            }
          }

          if (resp.serverContent?.turnComplete) {
            console.log("[GEMINI] turnComplete");
            if (this.onTurnComplete) this.onTurnComplete();
          }

          if (resp.serverContent?.interrupted) {
            console.log("[GEMINI] interrupted");
          }
        } catch (e) {
          console.error("[GEMINI] Parse error:", e.message);
        }
      });

      this.ws.on("close", (code, reason) => {
        this.isConnected = false;
        this.setupDone = false;
        console.log(`[GEMINI] Closed code=${code} reason=${reason.toString().substring(0, 100)}`);
      });

      this.ws.on("error", (e) => {
        console.error("[GEMINI] Error:", e.message);
        reject(e);
      });
    });
  }

  sendAudioChunk(base64PCM) {
    if (!this.isConnected || !this.setupDone) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: { mimeType: "audio/pcm;rate=16000", data: base64PCM }
        }
      })
    );
  }

  close() {
    if (this.ws) this.ws.close();
  }
}
