import { Pinecone } from '@pinecone-database/pinecone';
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

let index = null;

function getIndex() {
  if (index) return index;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is missing in environment variables');
  }

  const pc = new Pinecone({ apiKey });
  const indexName = process.env.PINECONE_INDEX || 'lunaa-knowledge';
  index = pc.index(indexName);
  return index;
}

/**
 * Tạo embedding cho văn bản sử dụng Google Text Embedding 004
 */
async function getEmbedding(text) {
  const { embedding } = await embed({
    model: google.embedding('gemini-embedding-001'),
    value: text,
  });
  return embedding;
}

/**
 * Lưu trữ tóm tắt phiên vào Pinecone (Upsert)
 */
export async function upsertDocument(id, text, metadata = {}) {
  try {
    const vector = await getEmbedding(text);
    await getIndex().upsert({
      records: [
        {
          id,
          values: vector,
          metadata: {
            ...metadata,
            text,
            createdAt: new Date().toISOString(),
          },
        },
      ]
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Tìm kiếm các phiên liên quan (Search)
 */
export async function searchSimilar(query, limit = 10) {
  try {
    const vector = await getEmbedding(query);
    const results = await getIndex().query({
      vector,
      topK: limit,
      includeMetadata: true,
    });

    return results.matches
      .filter(m => m.metadata && m.score && m.score > 0.3) // Hạ ngưỡng xuống 0.3 để tăng độ nhạy
      .map(m => ({
        id: m.id,
        text: m.metadata.text,
        score: m.score,
        metadata: m.metadata,
      }));
  } catch (error) {
    return [];
  }
}
