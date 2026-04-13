import { NextResponse } from 'next/server';

/**
 * This endpoint is deprecated.
 * Session data is now persisted client-side via local-rag.ts (Orama + IndexedDB).
 * Pinecone writes have been removed. Pinecone reads are still active via /api/chat.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Data is now stored locally in the browser.' },
    { status: 410 }
  );
}
