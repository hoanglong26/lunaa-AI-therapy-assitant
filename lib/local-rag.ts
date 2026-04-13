'use client';

/**
 * Local RAG Library
 * Handles all client-side vector storage and search using:
 * - Transformers.js (via Web Worker) for embeddings
 * - Orama for in-memory vector search
 * - IndexedDB (via idb) for persistence across page refreshes
 *
 * Architecture: WRITE-only (Pinecone handles READ of old data)
 */

import { create, insert, search, count } from '@orama/orama';
import { openDB, type IDBPDatabase } from 'idb';

// ─── Constants ────────────────────────────────────────────────────────────────
const DB_NAME = 'lunaa-rag-store';
const DB_VERSION = 1;
const STORE_NAME = 'orama-state';
const STATE_KEY = 'graph';
const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2 output dimension

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface LocalDoc {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

// ─── Singleton State ──────────────────────────────────────────────────────────
let db: ReturnType<typeof create> extends Promise<infer T> ? T : never;
let idbInstance: IDBPDatabase | null = null;
let worker: Worker | null = null;
let workerReady = false;
let pendingCallbacks = new Map<string, { resolve: (v: number[]) => void; reject: (e: Error) => void }>();
let _msgId = 0;

// ─── Worker Management ────────────────────────────────────────────────────────
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/embedding-worker.js', { type: 'module' });

    worker.onmessage = (e) => {
      const { id, type, embedding, error } = e.data;
      const cb = pendingCallbacks.get(id);
      if (!cb) return;
      pendingCallbacks.delete(id);
      if (type === 'result') cb.resolve(embedding);
      else if (type === 'ready') cb.resolve([]);
      else cb.reject(new Error(error ?? 'Worker error'));
    };

    worker.onerror = (e) => {
      console.error('[LocalRAG] Worker error:', e.message);
    };
  }
  return worker;
}

function embedText(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const id = String(++_msgId);
    pendingCallbacks.set(id, { resolve, reject });
    getWorker().postMessage({ id, type: 'embed', text });
  });
}

// ─── IndexedDB Persistence ────────────────────────────────────────────────────
async function getIDB(): Promise<IDBPDatabase> {
  if (!idbInstance) {
    idbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return idbInstance;
}

async function saveStateToDB(): Promise<void> {
  try {
    // Orama doesn't expose a serialize method in v3 — we persist inserted docs separately
    // This is handled via a separate document store in IndexedDB
    // (Orama is rebuilt from scratch on each page load from stored docs)
  } catch (e) {
    console.warn('[LocalRAG] Failed to persist state:', e);
  }
}

// ─── Database Init ─────────────────────────────────────────────────────────────
/**
 * Initializes the Orama in-memory DB and loads any persisted documents
 * from IndexedDB. Call this once on app startup.
 */
export async function initLocalDB(): Promise<void> {
  // Create fresh Orama DB each time (restored from IndexedDB docs below)
  db = await create({
    schema: {
      id: 'string',
      text: 'string',
      metadata: 'string',
      createdAt: 'string',
      embedding: `vector[${EMBEDDING_DIM}]`,
    },
  });

  // Restore persisted documents from IndexedDB
  try {
    const idb = await getIDB();
    const storedDocs = await idb.getAll(STORE_NAME);

    if (storedDocs.length > 0) {
      for (const doc of storedDocs) {
        await insert(db, doc);
      }
      console.log(`[LocalRAG] Restored ${storedDocs.length} documents from IndexedDB`);
    }
  } catch (e) {
    console.warn('[LocalRAG] Failed to restore from IndexedDB:', e);
  }

  // Pre-warm the embedding model in the background (non-blocking)
  preWarmModel();
}

function preWarmModel(): void {
  const id = String(++_msgId);
  pendingCallbacks.set(id, {
    resolve: () => { workerReady = true; console.log('[LocalRAG] Embedding model ready ✅'); },
    reject: (e) => console.warn('[LocalRAG] Model pre-warm failed:', e.message),
  });
  getWorker().postMessage({ id, type: 'ping' });
}

// ─── Write ────────────────────────────────────────────────────────────────────
/**
 * Saves a document (e.g. session summary) to the local DB.
 * Generates an embedding via the Web Worker and persists to IndexedDB.
 */
export async function saveToLocalDB(
  id: string,
  text: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!db) {
    console.warn('[LocalRAG] DB not initialized. Call initLocalDB() first.');
    return;
  }

  try {
    // Generate embedding via Web Worker (off main thread)
    const embedding = await embedText(text);

    const doc = {
      id,
      text,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString(),
      embedding,
    };

    // Insert into in-memory Orama index
    await insert(db, doc);

    // Persist the raw document to IndexedDB for next reload
    const idb = await getIDB();
    await idb.put(STORE_NAME, doc, id);

    console.log(`[LocalRAG] Saved "${id}" (${text.length} chars, ${embedding.length}d vector)`);
  } catch (e) {
    console.error('[LocalRAG] Save failed:', e);
    throw e;
  }
}

// ─── Read ──────────────────────────────────────────────────────────────────────
/**
 * Searches the local DB using vector similarity.
 * Returns the top-k most relevant documents.
 */
export async function searchLocalDB(query: string, limit = 5): Promise<LocalDoc[]> {
  if (!db) return [];

  const total = await count(db);
  if (total === 0) return [];

  try {
    const queryEmbedding = await embedText(query);

    const results = await search(db, {
      mode: 'vector',
      vector: { value: queryEmbedding, property: 'embedding' },
      similarity: 0.3, // Lowered threshold from 0.7 to 0.3 to match Pinecone's sensitivity
      limit,
    });

    return results.hits.map((hit) => ({
      id: hit.id as string,
      text: (hit.document as Record<string, string>).text,
      score: hit.score,
      metadata: JSON.parse((hit.document as Record<string, string>).metadata || '{}'),
    }));
  } catch (e) {
    console.warn('[LocalRAG] Search failed:', e);
    return [];
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export async function getLocalDBCount(): Promise<number> {
  if (!db) return 0;
  return count(db);
}

export async function clearLocalDB(): Promise<void> {
  const idb = await getIDB();
  await idb.clear(STORE_NAME);
  // Re-init fresh empty DB
  await initLocalDB();
  console.log('[LocalRAG] Local database cleared');
}

/**
 * Debug utility to see all stored documents in console
 */
export async function debugGetAllDocs(): Promise<any[]> {
  const idb = await getIDB();
  const docs = await idb.getAll(STORE_NAME);
  console.log(`[LocalRAG Debug] Total docs: ${docs.length}`);
  console.table(docs.map(d => ({
    id: d.id,
    text: d.text.substring(0, 100) + '...',
    createdAt: d.createdAt
  })));
  return docs;
}

// Expose to window for easy console debugging
if (typeof window !== 'undefined') {
  (window as any).debugLocalRAG = debugGetAllDocs;
}
