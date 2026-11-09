# 🌙 LUNAA - AI Mental Health Voice & Text Companion

> **Người bạn AI đồng hành và tham vấn tâm lý sơ bộ đầu tiên tập trung vào tiếng Việt**, tích hợp công nghệ đàm thoại giọng nói thời gian thực siêu trễ thấp (Full-duplex) và hệ thống tra cứu tri thức chuyên môn đa tầng (Hybrid RAG).

---

## 📖 1. TỔNG QUAN DỰ ÁN (OVERVIEW)

**Lunaa** được thiết kế như một không gian an toàn (Safe Space), bảo mật và không phán xét dành riêng cho người Việt, giúp xoa dịu những áp lực hiện sinh (burnout, peer pressure, kỳ vọng gia đình, khủng hoảng tuổi trẻ). 

Ứng dụng hỗ trợ song song 2 chế độ tương tác mượt mà:
* **💬 Text Chat Mode (Trò chuyện văn bản):** Kết hợp tìm kiếm tri thức chuyên môn từ Pinecone Vector DB và truy xuất ký ức hành trình cá nhân hóa từ bộ nhớ trình duyệt (IndexedDB / Orama).
* **🎙️ Real-time Voice Call Mode (Gọi thoại trực tiếp):** Tương tác giọng nói hai chiều trực tiếp (Native Audio Streaming) với độ trễ siêu thấp (<1s), hỗ trợ ngắt lời tự nhiên (Barge-in / VAD) và giữ vững một định danh giọng nữ điềm đạm, ấm áp.

---

## 🛠️ 2. KIẾN TRÚC CÔNG NGHỆ (TECH STACK)

| Phân tầng | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)**, React 19, Tailwind CSS v4 | Giao diện hiện đại, tối ưu SEO, hỗ trợ Server Components & Client Streaming. |
| **Animation & UX** | Framer Motion, Lucide React, Stageshow | Hiệu ứng chuyển động mượt mà, quả cầu âm thanh sống động (Voice Orb). |
| **AI Client SDK** | Vercel AI SDK (`ai/react`), `@elevenlabs/react` | Điều phối luồng dữ liệu stream và kết nối agent đàm thoại. |
| **Audio Processing** | Web Audio API, AudioWorklet (`pcm-worker.js`), `hark.js` | Thu âm PCM 16kHz, phát âm thanh PCM 24kHz, phát hiện năng lượng giọng nói để ngắt tiếng AI tức thì. |
| **Backend & WS Server**| Custom Node.js Server (`server.mjs`), `ws` | Tích hợp cổng HTTP và cổng WebSocket `/api/ws` trên cùng một server. |
| **AI Brain (Text)** | **Google Gemini 2.5 Flash** | Suy luận lâm sàng, phản hồi thấu cảm, tóm tắt và nén dữ liệu bối cảnh. |
| **AI Voice (Primary)** | **Google Gemini Live 3.8** (`models/gemini-3.8-live`) | Đàm thoại âm thanh hai chiều trực tiếp (Native Multimodal), giọng mẫu `Aoede`. |
| **AI Voice (Alternative)** | **ElevenLabs Conversational AI Agent** | Kênh thoại dự phòng độ biểu cảm cao kết nối trực tiếp qua Web SDK. |
| **External Vector DB** | **Pinecone Serverless** (`lunaa-knowledge`) | Lưu trữ 596 đơn vị tài liệu tham vấn tâm lý & ICD-11 (Vector 768d, Cosine Metric). |
| **Client Memory (Local)**| **IndexedDB** + **@orama/orama** + **Transformers.js** | Ký ức đa phiên cục bộ: nhúng vector offline 384d (`all-MiniLM-L6-v2`) ngay trên trình duyệt. |

---

## 🏛️ 3. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```mermaid
flowchart TB
    %% TẦNG CLIENT
    subgraph ClientLayer ["1. CLIENT TIER (Browser / Next.js)"]
        UI["🎨 UI & Components<br/>(Chat, History Sidebar, Modals)"]
        AudioEngine["🎙️ Audio Engine<br/>• pcm-worker (16kHz PCM In)<br/>• hark (Barge-in VAD)<br/>• AudioContext (24kHz PCM Out)"]
        LocalStore["💾 Local Memory<br/>• IndexedDB (Session Store)<br/>• Orama Vector Store (384d)"]
    end

    %% TẦNG BACKEND
    subgraph ServerLayer ["2. BACKEND TIER (Node.js Server)"]
        WSServer["🔌 WebSocket Gateway (/api/ws)<br/>(lib/websocket-handler.mjs)"]
        APIRoutes["⚡ Next.js API Routes<br/>• /api/chat (RAG + Text Streaming)<br/>• /api/summary (Đánh giá phiên)<br/>• /api/summarize-context (Nén bối cảnh)"]
    end

    %% TẦNG DỮ LIỆU & AI
    subgraph ServiceLayer ["3. AI BRAIN & DATA TIER"]
        Pinecone[("🌲 Pinecone Vector DB<br/>(596 tài liệu tâm lý 768d)")]
        GeminiFlash["🧠 Gemini 2.5 Flash<br/>(Text RAG & Summarization)"]
        GeminiLive["🔊 Gemini Live 3.8<br/>(Bidi Native Audio - Voice Call)"]
        ElevenLabs["🎙️ ElevenLabs Agent<br/>(Alternative Voice Engine)"]
    end

    %% KẾT NỐI GIỮA CÁC TẦNG
    UI <-->|"Đọc / Ghi ký ức"| LocalStore

    %% Text Mode
    UI -->|"HTTP POST (Chat + LocalContext)"| APIRoutes
    APIRoutes -->|"Vector Search (topK=20)"| Pinecone
    APIRoutes -->|"Stream Text"| GeminiFlash
    APIRoutes -->|"SSE Response Stream"| UI

    %% Voice Mode (Gemini)
    AudioEngine <==|"WebSocket (Binary 16kHz In / 24kHz Out)"|==> WSServer
    WSServer <==|"Bidi WebSocket Stream"|==> GeminiLive

    %% Voice Mode (ElevenLabs Fallback)
    UI <==|"Web SDK Direct Connection"|==> ElevenLabs
```

---

## 🔄 4. LUỒNG DỮ LIỆU KỸ THUẬT (DATA FLOW)

### 4.1. Luồng Text Chat Mode (Hybrid RAG Pipeline)
1. **Client Context Injection:** Người dùng gửi tin nhắn, interceptor tại `app/page.tsx` tự động chèn `preloadedLocalContext` (hành trình đã nén từ IndexedDB) vào payload gửi tới `/api/chat`.
2. **Server-side Retrieval:** Backend trích xuất câu nói gần nhất, gọi Google Embedding API (`gemini-embedding-001`, 768d) và truy vấn Pinecone Index để lấy 20 đoạn tri thức phù hợp nhất (ngưỡng `score > 0.3`).
3. **Prompt Synthesis:** Hợp nhất `LUNA_SYSTEM_PROMPT` + Tri thức Pinecone + Bối cảnh gần Local + Lịch sử hội thoại.
4. **Token Streaming:** Gemini 2.5 Flash truyền luồng văn bản (`DataStreamResponse`) trực tiếp về trình duyệt hiển thị hiệu ứng gõ chữ.
5. **Lưu trữ phiên:** Khi kết thúc phiên, `/api/summary` phân tích cảm xúc và lưu đồng thời vào IndexedDB và vector store Orama trên client.

### 4.2. Luồng Real-time Voice Call Mode (Gemini Live Native Audio)
1. **Audio Capture:** Micro thu tín hiệu người dùng, `AudioWorklet` chuyển đổi sang mảng nhị phân Int16 PCM 16kHz.
2. **WebSocket Upstream:** Chuyển tiếp luồng âm thanh nhị phân liên tục qua kênh `/api/ws` tới Google Gemini Live (`wss://generativelanguage.googleapis.com/.../BidiGenerateContent`).
3. **Native Downstream:** Gemini Live sinh trực tiếp âm thanh dạng raw PCM 24kHz (không qua Text-to-Speech trung gian), server đẩy thẳng về Client để phát ngay qua `AudioContext`.
4. **Barge-in / Ngắt lời tự nhiên:** Thư viện `hark` phát hiện khi người dùng cất giọng nói chen ngang, lập tức ngắt toàn bộ âm thanh AI đang phát (`stopAllAudio()`) và gửi tín hiệu `START_TURN` để Gemini Live chuyển sang lắng nghe lượt mới.

---

## 🤖 5. PHÂN ĐỊNH VAI TRÒ CÁC CÔNG CỤ AI

| Công cụ AI | Vai trò cốt lõi | Trách nhiệm trong dự án |
| :--- | :--- | :--- |
| **Google Gemini Pro** | **Data Cleaning & Structuring** | Phân tích ngữ nghĩa tài liệu tâm lý/ICD-11 thô, loại bỏ nhiễu và chuẩn hóa thành 596 bản ghi tri thức cấu trúc sạch (`data.csv`). |
| **Google Antigravity** | **AI Software Engineering & Orchestration** | Kiến trúc sư trưởng: thiết kế luồng hệ thống, lập trình Full-stack Next.js/WebSocket/AudioWorklet, xây dựng script nạp Pinecone tự động và tối ưu hóa mã nguồn. |
| **Google Gemini Live (3.8)**| **Primary Real-time Voice Engine** | Động cơ thoại trực tiếp hai chiều (Full-duplex Native Audio) với độ trễ siêu thấp, giữ vững âm sắc giọng nữ điềm tĩnh 25-28 tuổi. |
| **ElevenLabs Agent** | **Alternative Voice Engine** | Động cơ thoại dự phòng chất lượng phòng thu, đảm bảo tính liên tục của hệ thống và đa dạng hóa trải nghiệm cảm xúc. |

### 📌 Quy trình tuyến tính 5 bước (End-to-End Process):
```text
Tài liệu tâm lý học & ICD-11 thô 
→ Gemini Pro lọc nhiễu, chuẩn hóa thành 596 bản ghi dữ liệu sạch 
→ Antigravity thiết kế kiến trúc, lập trình toàn bộ ứng dụng & nạp dữ liệu vào Pinecone 
→ Gemini Live & Gemini 2.5 Flash tiếp nhận giọng nói/văn bản và suy luận hỗ trợ tâm lý 
→ Ứng dụng Lunaa hoàn chỉnh (Hỗ trợ song song Chat RAG & Gọi thoại thời gian thực) 
→ Đánh giá độ trễ siêu thấp (<1s), tính thấu cảm và độ an toàn tâm lý (Guardrails).
```

---

## 🛡️ 6. NGUYÊN TẮC AN TOÀN & BẢO HỘ TÂM LÝ (GUARDRAILS)

* **Voice Identity Anchor:** Bắt buộc duy trì một âm sắc giọng nữ duy nhất (25–28 tuổi), nhả chữ thong thả, ấm áp; nghiêm cấm biến thiên giọng hay nhảy pitch the thé.
* **Khử tính Robot (De-robotize):** Không nói "Tôi là AI", không đưa ra lời khuyên sáo rỗng hoặc danh sách gạch đầu dòng khô khan. Dùng khoảng lặng (`...`) để người dùng có không gian thở và lắng lại.
* **Thấu hiểu văn hóa Á Đông:** Tôn trọng ranh giới gia đình đa thế hệ, chữ "Hiếu" và áp lực đồng trang lứa của Gen Z / Millennials tại Việt Nam.
* **🚨 Quy trình Sơ cứu Tâm lý Khẩn cấp:** Khi phát hiện tín hiệu nguy cơ tự hại hoặc tự sát, AI lập tức dừng mọi phân tích, xoa dịu cảm xúc và cung cấp đường dây nóng cứu trợ khẩn cấp tại Việt Nam: **`1800 599 920`**.

---

## 🚀 7. HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Yêu cầu môi trường
* Node.js 18+ (khuyên dùng Node.js 20 hoặc 22)
* Khóa API: Google Generative AI (Gemini), Pinecone API Key

### 2. Cài đặt thư viện
```bash
cd lunaa-app
npm install
```

### 3. Cấu hình biến môi trường (`.env.local`)
Tạo file `.env.local` tại thư mục `lunaa-app` với nội dung mẫu:
```env
# Google AI API Key (Dùng cho Gemini 2.5 Flash, Gemini Live 3.8 và Embedding)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"
GEMINI_VOICE_NAME="Aoede"

# Pinecone Vector Database
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="lunaa-knowledge"

# Cấu hình Voice Engine ("gemini" hoặc "elevenlabs")
VOICE_ENGINE="gemini"

# (Tùy chọn) ElevenLabs nếu sử dụng làm Voice Engine
ELEVENLABS_API_KEY="your-elevenlabs-key"
ELEVENLABS_AGENT_ID="your-agent-id"
```

### 4. Nạp tri thức vào Pinecone (Data Ingestion)
Chạy script tự động nạp 596 bản ghi tri thức tâm lý từ file CSV vào Pinecone:
```bash
node scripts/import-knowledge.mjs
```
*(Script tích hợp sẵn cơ chế checkpoint và tự động retry nếu gặp lỗi mạng).*

### 5. Khởi chạy ứng dụng
Chạy server tích hợp (cả HTTP và WebSocket cho Voice Mode):
```bash
npm run dev:ws
```
Mở trình duyệt và truy cập: **`http://localhost:3000`**.

---

## 📄 Bản quyền & Đóng góp
Dự án được xây dựng vì mục đích nghiên cứu và hỗ trợ cộng đồng sức khỏe tinh thần tại Việt Nam. Mọi đóng góp xin vui lòng tạo Pull Request hoặc mở Issue trên GitHub.
