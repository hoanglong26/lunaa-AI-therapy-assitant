import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// server.mjs
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { handleWebSocketConnection } from './lib/websocket-handler.mjs';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Khởi tạo Next.js App
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Khởi tạo WebSocket Server (không truyền server vào constructor để tự xử lý upgrade)
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    handleWebSocketConnection(ws);
  });

  // Tự tay xử lý sự kiện 'upgrade' để không làm hỏng HMR của Next.js
  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url);

    if (pathname === '/api/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // Các yêu cầu upgrade khác (như _next/webpack-hmr) sẽ được Next.js tự động xử lý
    // vì Next.js cũng lắng nghe sự kiện upgrade trên server này.
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Websocket ready on ws://${hostname}:${port}/api/ws`);
  });
});
