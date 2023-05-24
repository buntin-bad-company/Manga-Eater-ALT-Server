import express, { Application, Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import ServerStatusManager from './ServerStatusManager';
import {
  BadCompanyRouter,
  DirectoryRouters,
  UrlRouter,
  ChannelRouter,
  IndexRouter
} from './routes';

console.log('Manga Eater Server is Starting...\nThis is a index.ts');

const app: Application = express();
const PORT = 11150;

//export const outDir = '/filerun/user-files/out';
export const outDir = './out';



//cors
app.use((
  req: Request,
  res: Response,
  next: Function
): void => {
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

//urlからダウンロード
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

export const ssm = new ServerStatusManager(io);

io.on('connection', (socket) => {
  console.log('A client has connected.');
  socket.on('disconnect', () => {
    console.log('A client has disconnected.');
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
