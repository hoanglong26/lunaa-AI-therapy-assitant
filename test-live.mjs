import WebSocket from "ws";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(url);

ws.on("open", () => {
    ws.send(JSON.stringify({
        setup: {
            model: "models/gemini-3.1-flash-live-preview",
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
    }));
});

ws.on("message", (data) => {
    const json = JSON.parse(data.toString());
    console.log("RECEIVED message keys:", Object.keys(json));
    
    if (json.setupComplete) {
        console.log("Sending wakeup containing ONLY turns...");
        ws.send(JSON.stringify({
            clientContent: {
                turns: [{ role: "user", parts: [{ text: "Hãy chào tôi ngắn gọn để bắt đầu cuộc trò chuyện." }] }],
                turnComplete: true
            }
        }));
    }
});

ws.on("close", (code, reason) => {
    console.log(`ws closed: ${code} ${reason}`);
    process.exit(1);
});

// timeout exit
setTimeout(() => { console.log('timeout exited'); process.exit(0); }, 3000);
