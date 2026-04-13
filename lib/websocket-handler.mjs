import { GeminiLiveWS } from './gemini-live.mjs';
import { LUNA_SYSTEM_PROMPT } from './prompt.mjs';
import { searchSimilar } from './vector-store.mjs';

export function handleWebSocketConnection(clientWs) {
  let gemini = null;
  let isInitialized = false;
  let initPromise = null; // Shared promise so concurrent callers can await
  let turnTextAccumulator = "";
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  async function ensureConnections(customContext = "") {
    if (isInitialized) return;

    // Nếu đang trong quá trình khởi tạo, đợi promise hiện tại hoàn thành
    if (initPromise) {
      console.log("[WS] Waiting for existing initialization to complete...");
      await initPromise;
      return;
    }

    // Bắt đầu quá trình khởi tạo thực tế và lưu lại promise
    initPromise = _doInit(customContext);
    try {
      await initPromise;
    } finally {
      initPromise = null;
    }
  }

  async function _doInit(customContext) {
    try {
      const systemPrompt = LUNA_SYSTEM_PROMPT + (customContext ? `\n\n[BỐI CẢNH QUÁ KHỨ ĐƯỢC TRA CỨU: ${customContext}]` : "");
      console.log(`[WS] Initializing Gemini Live (context: ${customContext ? customContext.length + ' chars' : 'none'})...`);
      
      gemini = new GeminiLiveWS(apiKey, systemPrompt, {
        onAudioChunk: (pcmBuffer) => {
          if (clientWs.readyState === 1) {
            clientWs.send(pcmBuffer, { binary: true });
          }
        },
        onTextChunk: (text) => {
          turnTextAccumulator += text;
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: 'text', content: text }));
          }
        },
        onUserTranscript: (text) => {
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: 'user_text', content: text }));
          }
        },
        onTurnComplete: () => {
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({
              type: 'turn_complete',
              fullText: turnTextAccumulator
            }));
          }
          turnTextAccumulator = "";
        }
      });

      await gemini.connect();
      isInitialized = true;
      console.log("[WS] Gemini Live initialized successfully ✅");

      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'system', content: 'ready' }));
      }
    } catch (err) {
      console.error("[WS] Fatal error during initialization:", err);
      isInitialized = false;
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'error', content: 'Lỗi khởi tạo kết nối với Gemini' }));
      }
    }
  }

  clientWs.on('message', async (data, isBinary) => {
    if (!isBinary) {
      const msg = data.toString().trim();

      if (msg === 'START_TURN') {
        // Wait for initialization if not yet ready
        if (!isInitialized) await ensureConnections();
      } else if (msg.startsWith('SET_CONTEXT:')) {
        const context = msg.replace('SET_CONTEXT:', '').trim();
        await ensureConnections(context);
      } else if (msg === 'STOP') {
        if (gemini) gemini.close();
        isInitialized = false;
      }
      return;
    }

    // Binary audio data from client mic (PCM 16kHz)
    if (data.length > 1 && gemini?.isConnected && gemini?.setupDone) {
      const base64PCM = Buffer.from(data).toString('base64');
      gemini.sendAudioChunk(base64PCM);
    }
  });

  clientWs.on('close', () => {
    if (gemini) gemini.close();
  });
}
