import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { searchSimilar } from "@/lib/vector-store"; // [RAG] Nhập hàm tìm kiếm
import { GEMINI_MODEL_ID } from "../config";

export const maxDuration = 30;

import { LUNA_SYSTEM_PROMPT } from "@/lib/prompt.mjs";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Log để debug (xem trong terminal npm run dev)
  console.log("--- CHAT REQUEST ---");
  console.log("Messages count:", messages.length);
  const lastMsg = messages[messages.length - 1];
  console.log("Last message role:", lastMsg?.role);

  // [RAG] Lấy tin nhắn cuối cùng để search kiến thức liên quan
  const lastMessageContent = typeof lastMsg?.content === 'string'
    ? lastMsg.content
    : lastMsg?.content?.find((p: any) => p.type === 'text')?.text || "";

  console.log("Last message content preview:", lastMessageContent.substring(0, 50));

  if (lastMsg?.experimental_attachments) {
    console.log("Attachments count:", lastMsg.experimental_attachments.length);
    lastMsg.experimental_attachments.forEach((a: any, i: number) => {
      console.log(`Attachment ${i} type:`, a.contentType);
    });
  }

  let ragContext = "";
  if (lastMessageContent && process.env.PINECONE_API_KEY) {
    try {
      const docs = await searchSimilar(lastMessageContent, 2);
      if (docs.length > 0) {
        ragContext = `\n\n[KIẾN THỨC CHUYÊN MÔN / BỆNH ÁN CŨ KHẢ QUAN: 
${docs.map(d => `- ${d.text}`).join('\n')}
(Lưu ý: Dựa vào thông tin trên nếu nó liên quan để trả lời tự nhiên nhất, không cần nhắc tên Database hoặc nguồn gốc thông tin)]`;
      }
    } catch {
      // Ignored for graceful degradation
    }
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

  console.log("Gemini is processing with multimodal data...");

  try {
    const result = streamText({
      model: google(GEMINI_MODEL_ID),
      system: LUNA_SYSTEM_PROMPT + ragContext,
      messages: formattedMessages,
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta" && chunk.textDelta) {
          process.stdout.write(chunk.textDelta);
        }
      },
      onFinish: () => {
        console.log("\nGemini finished responding.");
      },
      onError: (error) => {
        console.error("\n[Gemini Stream Error]:", error);
      }
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    console.error("\n[Fatal Backend Error]:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
