import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config({ path: "./.env.local" });

export class MinimaxWS {
  constructor(apiKey, voiceSetting, onAudioChunk) {
    this.apiKey = apiKey;
    this.voiceSetting = voiceSetting;
    this.onAudioChunk = onAudioChunk;
    this.ws = null;
    this.isConnected = false;
    this.isTaskStarted = false;
    this.textQueue = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('wss://api.minimax.io/ws/v1/t2a_v2', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      this.ws.on('open', () => {
        this.isConnected = true;
        this.ws.send(JSON.stringify({
          event: "task_start",
          task_start: {
            model: "speech-2.8-turbo",
            voice_setting: this.voiceSetting,
            audio_setting: { sample_rate: 32000, bitrate: 128000, format: "pcm", channel: 1 }
          }
        }));
      });

      this.ws.on('message', (msg) => {
        try {
          const json = JSON.parse(msg.toString());
          if (json.event === 'task_started') {
            this.isTaskStarted = true;
            this._flushQueue();
            resolve();
          } else if (json.event === 'task_failed') {
            console.error("MiniMax Task Failed:", json);
            // fallback to http or retry
          } else if (json.event === 'task_continued' || json.event === 'task_update' || json.event === 'audio_result' || json.event === 'audio') {
            // Check for audio
            if (json.data && json.data.audio) {
               const buffer = Buffer.from(json.data.audio, 'hex'); // Minimax standard is hex
               if (this.onAudioChunk) this.onAudioChunk(buffer);
            }
          }
        } catch(e) {
          console.error("Minimax WS format error", e);
        }
      });
      
      this.ws.on('close', () => { this.isConnected = false; this.isTaskStarted = false; });
      this.ws.on('error', (e) => reject(e));
    });
  }

  sendText(text) {
    if (!text || text.trim().length === 0) return;
    this.textQueue.push(text);
    this._flushQueue();
  }

  _flushQueue() {
    if (this.isTaskStarted && this.ws && this.textQueue.length > 0) {
      while(this.textQueue.length > 0) {
        const txt = this.textQueue.shift();
        this.ws.send(JSON.stringify({
          event: "task_continue",
          // Send text in both root and data object to ensure compatibility
          text: txt,
          data: { text: txt },
          task_continue: { text: txt }
        }));
      }
    }
  }

  finish() {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ event: "task_finish" }));
    }
  }

  close() {
    if (this.ws) this.ws.close();
  }
}
