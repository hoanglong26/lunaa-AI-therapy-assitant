import { GeminiLiveWS } from './gemini-live.mjs';
import { LUNA_SYSTEM_PROMPT } from './prompt.mjs';

export function handleWebSocketConnection(clientWs) {
  let gemini = null;
  let isInitialized = false;
  let isInitializing = false;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  async function ensureConnections() {
    if (isInitialized || isInitializing) return;
    isInitializing = true;

    try {
      gemini = new GeminiLiveWS(apiKey, LUNA_SYSTEM_PROMPT, {
        // Gemini native audio → forward binary PCM directly to client
        onAudioChunk: (pcmBuffer) => {
          if (clientWs.readyState === 1) {
            clientWs.send(pcmBuffer, { binary: true });
          }
        },
        // Text from Gemini (non-thought) → display in UI
        onTextChunk: (text) => {
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: 'text', content: text }));
          }
        },
        // Turn complete
        onTurnComplete: () => {
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }
        }
      });

      await gemini.connect();
      isInitialized = true;
      console.log("[WS] Gemini Native Audio connected ✅");

      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'system', content: 'ready' }));
      }
    } catch (err) {
      console.error("[WS] Connection failed:", err.message);
      isInitialized = false;
    }
    isInitializing = false;
  }

  // Pre-connect immediately
  ensureConnections();

  clientWs.on('message', async (data, isBinary) => {
    if (!isBinary) {
      const msg = data.toString().trim();

      if (msg === 'START_TURN') {
        if (!isInitialized) await ensureConnections();
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
    console.log("[WS] Client disconnected");
  });
}
