/* import * as utils from './complexUtils';
import fs from 'fs';
import {
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getTitleAndEpisodes } from './routes/utils';
import { get } from 'request';

const url =
  'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC48.6%E8%A9%B1%E3%80%91%E3%82%A8%E3%83%AB%E3%83%95%E3%81%95%E3%82%93%E3%81%AF%E7%97%A9%E3%81%9B%E3%82%89%E3%82%8C%E3%81%AA%E3%81%84%E3%80%82-raw/';
(async () => {
  console.log(await getTitleAndEpisodes(url));
})();

const createModal = () => {
  const modal = new ModalBuilder().setCustomId('myModal').setTitle('My Modal');
  const favoriteColorInput = new TextInputBuilder()
    .setCustomId('favoriteColorInput')
    // The label is the prompt the user sees for this input
    .setLabel("What's your favorite color?")
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);
  const hobbiesInput = new TextInputBuilder()
    .setCustomId('hobbiesInput')
    .setLabel("What's some of your favorite hobbies?")
    // Paragraph means multiple lines of text.
    .setStyle(TextInputStyle.Paragraph);
  // An action row only holds one text input,
  // so you need one action row per text input.
  const firstActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      favoriteColorInput
    );
  const secondActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      hobbiesInput
    );
  modal.addComponents(firstActionRow, secondActionRow);
  const modalObj = modal.toJSON();
  fs.writeFileSync('modal.json', JSON.stringify(modalObj, null, 2));
  // Add inputs to the modal
  console.log(modal);
}; */
/* 
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

*/
