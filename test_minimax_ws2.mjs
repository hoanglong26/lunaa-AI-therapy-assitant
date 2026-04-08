import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const apiKey = process.env.MINIMAX_API_KEY;

const ws = new WebSocket('wss://api.minimax.io/ws/v1/t2a_v2', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

ws.on('open', () => {
  ws.send(JSON.stringify({ 
    event: "task_start", 
    text: "This is a test of Minimax TTS.", // some docs use text here
    task_start: {
      model: "speech-2.8-turbo",
      voice_setting: { voice_id: "English_Magnetic_Male_2" }
    }
  }));
});

ws.on('message', (d) => {
  const json = JSON.parse(d.toString());
  console.log("Event:", json.event);

  if (json.event === "task_started") {
    // Send more text
    ws.send(JSON.stringify({
      event: "task_continue",
      text: " And this is the continued part.", // maybe this works?
      task_continue: { text: " Just in case it expects here." } 
    }));
    
    setTimeout(() => {
      ws.send(JSON.stringify({ event: "task_finish" }));
    }, 500);
  }

  if (json.event === "audio") {
    console.log("Received audio:", json.data?.audio?.substring?.(0, 50));
  }
  if (json.event === "result") {
    console.log("Received result audio info", json.data ? Object.keys(json.data) : "");
  }
  if (json.data && json.data.audio) {
    console.log("Found audio fragment!!");
  }
});
