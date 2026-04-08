import { NextResponse } from 'next/server';
import { upsertDocument } from '@/lib/vector-store';

// LƯU Ý BẢO MẬT: Trong thực tế, endpoint này phải được bảo vệ bằng Auth
export async function POST(req: Request) {
  try {
    const { id, text, metadata } = await req.json();

    if (!id || !text) {
      return NextResponse.json({ error: 'Missing id or text' }, { status: 400 });
    }

    if (!process.env.PINECONE_API_KEY) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
    }

    await upsertDocument(id, text, metadata);

    return NextResponse.json({ success: true, message: `Document ${id} upserted successfully` });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Failed to ingest document' }, { status: 500 });
  }
}
