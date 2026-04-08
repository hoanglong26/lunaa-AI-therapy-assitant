const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const VOICE_ID = process.env.MINIMAX_VOICE_ID || "English_Magnetic_Male_2";

const FILLERS = [
  { id: 1, text: "Ừm...", filename: "filler-um.mp3" },
  { id: 2, text: "Mình nghe đây...", filename: "filler-nghe.mp3" },
  { id: 3, text: "Mình hiểu rồi...", filename: "filler-hieu.mp3" },
  { id: 4, text: "Bạn cứ nói đi, mình đang nghe...", filename: "filler-dang-nghe.mp3" },
];

async function generateFiller(filler) {
  console.log(`🎙️ Đang tạo [${filler.id}]: "${filler.text}"...`);

  const url = "https://api.minimax.io/v1/t2a_v2";

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "speech-2.8-turbo",
      text: filler.text,
      stream: false,
      voice_setting: {
        voice_id: VOICE_ID,
        speed: 0.9,
        vol: 1,
        pitch: 0,
        emotion: "fluent"
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1
      },
      language_boost: "Vietnamese"
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MiniMax API Error: ${error}`);
  }

  const result = await response.json();

  if (result.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax Error: ${result.base_resp?.status_msg}`);
  }

  const audioHex = result.data?.audio;
  if (!audioHex) {
    throw new Error("No audio data in response");
  }

  // Decode hex → binary
  const buffer = Buffer.from(audioHex, 'hex');

  const dir = path.join(__dirname, '..', 'public', 'sounds');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, filler.filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Đã lưu: ${filePath}`);
}

async function run() {
  if (!MINIMAX_API_KEY) {
    console.error("❌ Thiếu MINIMAX_API_KEY trong .env.local");
    process.exit(1);
  }

  console.log(`🔊 Voice ID: ${VOICE_ID}`);
  console.log(`📦 Model: speech-2.8-turbo`);
  console.log(`😊 Emotion: fluent\n`);

  for (const filler of FILLERS) {
    try {
      await generateFiller(filler);
    } catch (e) {
      console.error(`❌ Lỗi khi tạo [${filler.id}]:`, e.message);
    }
  }
  console.log("\n✨ Hoàn thành! Bộ filler sounds MiniMax đã sẵn sàng.");
}

run();
