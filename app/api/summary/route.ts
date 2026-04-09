import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GEMINI_MODEL_ID } from "../config";
import { upsertDocument } from "@/lib/vector-store";


export async function POST(req: Request) {
  const { messages } = await req.json();

  const conversationText = messages
    .map(
      (m: { role: string; content: string }) =>
        `${m.role === "user" ? "Người dùng" : "Luna"}: ${m.content}`
    )
    .join("\n");

  const { text } = await generateText({
    model: google(GEMINI_MODEL_ID),
    prompt: `Bạn là Luna, một chuyên gia tâm lý. Hãy phân tích buổi trò chuyện sau và tạo một bản tổng kết chuyên nghiệp bằng tiếng Việt.

Cuộc trò chuyện:
${conversationText}

Hãy tóm tắt theo các mục sau:
## 🧠 Tổng kết buổi trò chuyện

### Những điều bạn chia sẻ
[Tóm tắt ngắn gọn những vấn đề, cảm xúc chính người dùng đề cập]

### Nhận xét của Luna
[Phân tích chuyên sâu về trạng thái tâm lý, điểm mạnh và điểm cần chú ý]

### Hiệu quả buổi trò chuyện
[Đánh giá tiến trình: người dùng đã chia sẻ cởi mở chưa, có sự chuyển biến về nhận thức hay quản lý cảm xúc không]

### Gợi ý cho thời gian tới
[2-3 gợi ý cụ thể, thực tế để người dùng áp dụng]

### Lời nhắn từ Luna
[Một đoạn ngắn ấm áp, khích lệ và động viên người dùng tiếp tục hành trình]`,
  });

  // [VECTOR STORE] Lưu tóm tắt vào Pinecone để tra cứu sau này
  try {
    const summaryId = `summary_${Date.now()}`;
    await upsertDocument(summaryId, text, {
      type: "session_summary",
      messageCount: messages.length
    });
  } catch (err) {
  }

  return Response.json({ summary: text });
}
