import { GeminiLiveWS } from './gemini-live.mjs';
import { LUNA_SYSTEM_PROMPT } from './prompt.mjs';
import { searchSimilar } from './vector-store.mjs';

export function handleWebSocketConnection(clientWs) {
  let gemini = null;
  let isInitialized = false;
  let isInitializing = false;
  let turnTextAccumulator = "";
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  async function ensureConnections(customContext = "") {
    if (isInitialized || isInitializing) return;
    isInitializing = true;

    try {
      const systemPrompt = LUNA_SYSTEM_PROMPT + (customContext ? `\n\n[BỐI CẢNH QUÁ KHỨ ĐƯỢC TRA CỨU: ${customContext}]` : "");
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

      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'system', content: 'ready' }));
      }
    } catch (err) {
      isInitialized = false;
    }
    isInitializing = false;
  }

  // Removed immediate ensureConnections() to avoid race condition with SET_CONTEXT
  // ensureConnections();

  clientWs.on('message', async (data, isBinary) => {
    if (!isBinary) {
      const msg = data.toString().trim();

      if (msg === 'START_TURN') {
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
