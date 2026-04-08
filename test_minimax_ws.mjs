import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const apiKey = process.env.MINIMAX_API_KEY;
if (!apiKey) {
  console.error("Missing MINIMAX_API_KEY");
  process.exit(1);
}

const url = `wss://api.minimax.io/v1/t2a_v2/ws?api_key=${apiKey}`; // try query param? Or keep header only. Let's try both.
const ws = new WebSocket('wss://api.minimax.io/v1/t2a_v2/ws', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

let isSetup = false;

ws.on('open', () => {
  console.log("WS Opened");
});

ws.on('message', (data) => {
  const jsonStr = data.toString();
  console.log("Message:", jsonStr.substring(0, 300));
  
  // We can just rely on open, maybe there is no internal 'connected' message.
  if (!isSetup) {
    isSetup = true;
    console.log("Sending task_start");
    ws.send(JSON.stringify({
      req_id: Date.now().toString(),
      event: "task_start",
      task_start: {
        model: "speech-2.8-turbo",
        voice_setting: { voice_id: "English_Magnetic_Male_2" },
        audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 }
      }
    }));
    
    setTimeout(() => {
      console.log("Sending task_continue");
      ws.send(JSON.stringify({
        req_id: Date.now().toString(),
        event: "task_continue",
        task_continue: { text: "Hello Minimax Web Socket! " }
      }));
      
      setTimeout(() => {
        console.log("Sending task_finish");
        ws.send(JSON.stringify({
          req_id: Date.now().toString(),
          event: "task_finish"
        }));
      }, 500);
    }, 500);
  }
});

ws.on('error', (e) => {
  console.error("error", e);
});

ws.on('close', () => {
  console.log("WS Closed");
});
