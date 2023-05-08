import express from 'express';
import WebSocket from 'ws';
import http from 'http';

const app = express();
const PORT = 11150;

interface ServerStatus {
  state: 'idle' | 'busy' | 'error';
  message: string;
}

const server = http.createServer(app);
const wsServer = new WebSocket.Server({ noServer: true });

const connections = new Set<WebSocket>();

wsServer.on('connection', (socket, request) => {
  if (request.url === '/status') {
    connections.add(socket);

    const statusLoop = setInterval(() => {
      const status = generateServerStatus();
      sendStatus(status);
    }, 1000);

    socket.on('close', () => {
      connections.delete(socket);
      clearInterval(statusLoop);
    });
  }
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});

const generateServerStatus = (): ServerStatus => {
  const states: Array<'idle' | 'busy' | 'error'> = ['idle', 'busy', 'error'];
  const messages = ['Idle state', 'Busy state', 'Error state'];

  const index = Math.floor(Date.now() / 1000) % states.length;

  return {
    state: states[index],
    message: messages[index],
  };
};

const sendStatus = (payload: ServerStatus) => {
  const statusString = JSON.stringify(payload);
  for (const socket of connections) {
    socket.send(statusString);
  }
};

try {
  server.listen(PORT, () => {
    console.log(`Mock Server Started at: http://localhost:${PORT}/`);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
