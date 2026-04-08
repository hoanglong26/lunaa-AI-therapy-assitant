import { Pinecone } from '@pinecone-database/pinecone';
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

if (!process.env.PINECONE_API_KEY) {
  console.warn('PINECONE_API_KEY is missing. Vector DB functionality will be disabled.');
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'MISSING_API_KEY',
});

// Bạn cần tạo sẵn một index trên Pinecone tên là 'lunaa-knowledge' với Dimension = 768 (Của Google Embeddings)
const indexName = process.env.PINECONE_INDEX || 'lunaa-knowledge';

export async function getVectorStore() {
  return pinecone.index(indexName);
}

// Chuyển văn bản thành mã Vector bằng Google Gemini
export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: text,
  });
  return embedding;
}

// Lưu một đoạn text (Kiến thức/Bệnh án) vào Pinecone
export async function upsertDocument(id: string, text: string, metadata: Record<string, any> = {}) {
  try {
    const vector = await generateEmbedding(text);
    const index = await getVectorStore();
    
    await index.upsert({
      records: [
        {
          id,
          values: vector as number[],
          metadata: {
            text,
            ...metadata,
          },
        },
      ]
    });
    return true;
  } catch (error) {
    console.error('Error upserting document:', error);
    throw error;
  }
}

// Tìm kiếm các đoạn text tương đồng nhất với câu hỏi của User
export async function searchSimilar(query: string, topK: number = 3) {
  try {
    const vector = await generateEmbedding(query);
    const index = await getVectorStore();
    
    const queryResponse = await index.query({
      topK,
      vector,
      includeMetadata: true,
    });
    
    return queryResponse.matches
      .filter((match) => match.metadata && match.metadata.text)
      .map((match) => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.text as string,
        ...match.metadata,
      }));
  } catch (error) {
    console.error('Error searching similar documents:', error);
    return [];
  }
}
