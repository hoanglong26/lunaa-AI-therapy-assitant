import WebSocket from "ws";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: "./.env.local" });
const apiKey = process.env.MINIMAX_API_KEY;

const ws = new WebSocket('wss://api.minimax.io/ws/v1/t2a_v2', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

ws.on('open', () => {
  ws.send(JSON.stringify({
    event: "task_start",
    task_start: {
      model: "speech-2.8-turbo",
      voice_setting: { voice_id: "English_Magnetic_Male_2" }
    }
  }));
});

ws.on('message', (d) => {
  const json = JSON.parse(d.toString());
  console.log("Recevied:", Object.keys(json), json.event);

  if (json.event === "task_started") {
    // Let's try sending exactly as python example did
    const continueMsg = {
      event: "task_continue",
      text: "Hello, this is a test of the MiniMax WebSocket TTS API."
    };
    ws.send(JSON.stringify(continueMsg));
    
    // Also try with is_last?
    setTimeout(() => {
        ws.send(JSON.stringify({ event: "task_finish" }));
    }, 500);
  }

  if (json.event === "task_continued") {
    console.log("Got task_continued! Has audio?", !!json.data?.audio, !!json.audio);
    if (json.data && json.data.audio) {
      console.log("Audio chunk length:", json.data.audio.length);
    }
  }
});
