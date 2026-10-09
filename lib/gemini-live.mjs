import WebSocket from "ws";

export class GeminiLiveWS {
  constructor(apiKey, systemInstruction, { onAudioChunk, onTextChunk, onUserTranscript, onTurnComplete }) {
    this.apiKey = apiKey;
    this.systemInstruction = systemInstruction || "You are Lunaa, an empathetic AI.";
    this.onAudioChunk = onAudioChunk;
    this.onTextChunk = onTextChunk;
    this.onUserTranscript = onUserTranscript;
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
        // Construct setup message carefully
        const setupMessage = {
          setup: {
            model: "models/gemini-3.8-live",
            systemInstruction: {
              parts: [{ text: this.systemInstruction }]
            },
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: process.env.GEMINI_VOICE_NAME || "Kore" }
                }
              }
            },
            input_audio_transcription: {}
          }
        };

        this.ws.send(JSON.stringify(setupMessage));
      });

      this.ws.on("message", (data) => {
        try {
          const resp = JSON.parse(data.toString());

          // Handle user transcript from Gemini
          if (resp.serverContent?.inputTranscription) {
            const userText = resp.serverContent.inputTranscription.text;
            if (userText) {
              console.log(`[USER] ${userText}`);
              if (this.onUserTranscript) this.onUserTranscript(userText);
            }
          }

          if (resp.setupComplete) {
            this.setupDone = true;

            // Wake-up: gửi lời chào với chỉ dẫn cảm xúc ấm áp để Gemini bắt đầu nói ngay
            this.ws.send(JSON.stringify({
              realtimeInput: {
                text: "Hãy cất lời chào đầu tiên bằng chất giọng thật dịu dàng. Hãy nhớ sử dụng Inline Audio Tags như [warmly] hoặc [sighs] vào đầu câu để kích hoạt cảm xúc nhé."
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
              if (p.text && this.onTextChunk) {
                console.log(`\n[AI] ${p.text}`);
                this.onTextChunk(p.text);
              }
            }
          }

        } catch (e) {
          console.error(e.message);
        }
      });

      this.ws.on("close", (code, reason) => {
        this.isConnected = false;
        this.setupDone = false;
      });

      this.ws.on("error", (e) => {
        console.error(e.message);
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
