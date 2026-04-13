import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { searchSimilar } from "@/lib/vector-store"; // [RAG] Nhập hàm tìm kiếm
import { GEMINI_MODEL_ID } from "../config";

export const maxDuration = 30;

import { LUNA_SYSTEM_PROMPT } from "@/lib/prompt.mjs";

export async function POST(req: Request) {
  const { messages, localContext } = await req.json();

  const lastMsg = messages[messages.length - 1];

  // [RAG] Lấy tin nhắn cuối cùng để search kiến thức liên quan
  const lastMessageContent = typeof lastMsg?.content === 'string'
    ? lastMsg.content
    : lastMsg?.content?.find((p: any) => p.type === 'text')?.text || "";

  let pastContext = "";
  if (lastMessageContent && process.env.PINECONE_API_KEY) {
    try {
      // Tra cứu "không giới hạn" (lấy nhiều hơn để AI lọc)
      const docs = await searchSimilar(lastMessageContent, 50);
      if (docs.length > 0) {
        pastContext = `\n\n[BỐI CẢNH CÁC PHIÊN THAM VẤN CŨ (Pinecone):
${docs.map(d => `- ${d.text}`).join('\n')}
(Lưu ý: Chỉ sử dụng thông tin cũ nếu nó thực sự liên quan đến vấn đề hiện tại.)]`;
      }
    } catch (err) {
      console.error("[RAG] Error searching Pinecone:", err);
    }
  }

  // Merge Pinecone context (old sessions) with local context (recent sessions)
  if (localContext && typeof localContext === 'string') {
    const localSection = `\n\n[BỐI CẢNH CÁC PHIÊN THAM VẤN GẦN ĐÂY (Local):\n${localContext}\n(Ưu tiên thông tin này vì là dữ liệu mới nhất.)]`;
    pastContext = pastContext + localSection;
  }

  // Ánh xạ lại tin nhắn để hỗ trợ Multimodal (Audio) một cách tường minh cho Gemini
  const formattedMessages = messages.map((m: any) => {
    if (m.experimental_attachments && m.experimental_attachments.length > 0) {
      const hasAudio = m.experimental_attachments.some((a: any) => a.contentType?.startsWith("audio/"));

      if (hasAudio) {
        // Gemini ưu tiên định dạng Content Parts (array) khi có audio
        const parts: any[] = [
          { type: "text", text: m.content || "Vui lòng lắng nghe âm thanh và giọng nói này." }
        ];

        m.experimental_attachments.forEach((attachment: any) => {
          if (attachment.contentType?.startsWith("audio/")) {
            let base64Data = attachment.url;
            if (base64Data.includes(";base64,")) {
              base64Data = base64Data.split(";base64,")[1];
            }

            // Chuyển đổi sang Uint8Array (chuẩn hơn Buffer trong một số môi trường Edge)
            const binaryData = Buffer.from(base64Data, 'base64');
            const uint8Array = new Uint8Array(binaryData);

            parts.push({
              type: "file",
              data: uint8Array,
              mediaType: attachment.contentType // AI SDK v4 sử dụng mediaType
            });
          }
        });

        return { ...m, content: parts };
      }
    }
    return m;
  });

  try {
    const result = streamText({
      model: google(GEMINI_MODEL_ID),
      system: LUNA_SYSTEM_PROMPT + pastContext,
      messages: formattedMessages
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    console.error("\n[Fatal Backend Error]:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
