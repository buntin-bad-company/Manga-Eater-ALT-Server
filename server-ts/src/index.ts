import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import ServerStatusManager from './ServerStatusManager';
import {
  BadCompanyRouter,
  DirectoryRouters,
  UrlRouter,
  ChannelRouter,
  IndexRouter,
} from './routes';

console.log('Manga Eater Server is Starting...\nThis is a index.ts');

const app = express();
const PORT = 11150;

//const outDir = '/filerun/user-files/out';
const outDir = './out';

app.use((req, res, next) => {
  req.ssm = ssm;
  req.outdir = outDir;
  next();
});

//cors
app.use((req: Request, res: Response, next: Function): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, access_token'
  );
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', IndexRouter);

app.use('/url', UrlRouter);

app.use('/channel', ChannelRouter);

app.use('/directory', DirectoryRouters);

app.use('/badcompany', BadCompanyRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

//Server Status Manager
const ssm = new ServerStatusManager(io);

io.on('connection', (socket) => {
  console.log('WebSocket Client Connected');
  socket.on('getServerStatus', () => {
    const state = ssm.getStatus;
    socket.emit('serverStatus', state);
  });
  socket.on('disconnect', () => {
    console.log('WebSocket Client Disconnected');
  });
});

try {
  server.listen(PORT, () => {
    console.log(`Manga Eater Server Started in : http://localhost:${PORT}/`);
  });
} catch (e) {
  ssm.setMsg('Server Error');
  if (e instanceof Error) {
    console.error(e.message);
  }
}
