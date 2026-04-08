import { NextResponse } from 'next/server';
import { searchSimilar } from '@/lib/vector-store';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Truy vấn Pinecone thông qua RAG vector (Mặc định lấy 3 kết quả sát nhất)
    const matches = await searchSimilar(query, 3);

    if (matches.length === 0) {
      return NextResponse.json({ results: "Không tìm thấy thông tin phù hợp trong bộ nhớ (Pinecone)." });
    }

    // Ghép các đoạn text lại với nhau tạo thành Context cho LLM
    const contextText = matches
      .map(match => `[Nội dung tham khảo]: ${match.text}`)
      .join('\n\n');

    return NextResponse.json({ results: contextText });

  } catch (error) {
    console.error('Error in /api/knowledge:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
