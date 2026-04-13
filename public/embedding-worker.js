/**
 * Embedding Web Worker
 * Runs Transformers.js off the main thread to avoid UI freezes.
 * Model is loaded once and cached by the browser automatically.
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js';

// Use browser cache for the model (no re-download on refresh)
env.useBrowserCache = true;
env.allowLocalModels = false;

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
let extractor = null;

async function loadModel() {
  if (extractor) return extractor;
  extractor = await pipeline('feature-extraction', MODEL_ID, {
    quantized: true, // Use int8 quantized model (~23MB vs ~90MB)
  });
  return extractor;
}

self.onmessage = async (event) => {
  const { id, type, text } = event.data;

  if (type === 'embed') {
    try {
      // Load model (cached after first call)
      const model = await loadModel();

      // Generate embedding: mean pooling over token embeddings
      const output = await model(text, { pooling: 'mean', normalize: true });

      // Convert to plain Float32Array for transfer
      const embedding = Array.from(output.data);

      self.postMessage({ id, type: 'result', embedding });
    } catch (error) {
      self.postMessage({ id, type: 'error', error: error.message });
    }
  } else if (type === 'ping') {
    // Used to pre-warm the model on app startup
    try {
      await loadModel();
      self.postMessage({ id, type: 'ready' });
    } catch (error) {
      self.postMessage({ id, type: 'error', error: error.message });
    }
  }
};
