// =========================================================
// CẤU HÌNH CHUNG: GEMINI + MINIMAX TTS
// =========================================================

// ─── GEMINI CONFIG ──────────────────────────────────────
export const GEMINI_MODEL_ID = "gemini-2.5-flash";

// ─── MINIMAX TTS CONFIG ─────────────────────────────────
// Tài liệu: https://platform.minimaxi.com/docs/api-reference/speech-t2a-http

// Voice ID mặc định
export const DEFAULT_VOICE_ID = "English_Magnetic_Male_2";

// Model TTS
export const TTS_MODEL = "speech-2.8-turbo";

// API Endpoint
export const MINIMAX_TTS_URL = "https://api.minimax.io/v1/t2a_v2";

// Cấu hình giọng nói
export const VOICE_SETTING = {
  voice_id: DEFAULT_VOICE_ID,
  speed: 1.0,
  vol: 1,
  pitch: 0,
  emotion: "fluent",
};

// Cấu hình chất lượng âm thanh
export const AUDIO_SETTING = {
  sample_rate: 32000,
  bitrate: 128000,
  format: "mp3",
  channel: 1
};

// Emotion mapping: Gemini emotion tag → MiniMax emotion value
export const EMOTION_MAP: Record<string, string> = {
  happy: "happy",
  sad: "sad",
  angry: "angry",
  fearful: "fearful",
  surprised: "surprised",
  neutral: "fluent",
};

// Danh sách Sound Tags mà MiniMax hỗ trợ (whitelist)
const VALID_SOUND_TAGS = new Set([
  'sighs', 'emm', 'chuckle', 'laughs', 'breath',
  'lip-smacking', 'gasps', 'inhale', 'exhale',
  'sniffs', 'coughs', 'clear-throat'
]);

// Bộ lọc & chuyển đổi văn bản trước khi gửi TTS
export function sanitizeTTS(text: string): string {
  let cleanText = text;

  // 1. Loại bỏ các thẻ [EMOTION: ...]
  cleanText = cleanText.replace(/\[EMOTION:[^\]]+\]/g, "");

  // 2. Xử lý sound tags: giữ lại tag hợp lệ, xóa tag không hợp lệ
  cleanText = cleanText.replace(/\(([^)]+)\)/g, (match, content) => {
    const tag = content.trim().toLowerCase();
    if (VALID_SOUND_TAGS.has(tag)) {
      return match;
    }
    return '';
  });

  // 3. Loại bỏ markdown formatting
  cleanText = cleanText.replace(/#{1,6}\s/g, "");
  cleanText = cleanText.replace(/\*/g, "");

  return cleanText.trim();
}

// Hàm decode hex string từ MiniMax response thành binary Buffer
export function hexToBuffer(hexString: string): Uint8Array {
  const buffer = Buffer.from(hexString, "hex");
  return new Uint8Array(buffer);
}
