import express, { Application, Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import fs from 'fs';
import path from 'path';
import * as utils from './scrapeUtils';
import { Config, DirectoryOutbound, Checked } from './types';
import Discord from './Discord';
import ServerStatusManager from './ServerStatusManager';
import BadCompanyRouter from './routes/BadCompany';
import DirectoryRouters from './routes/Directory';
import UrlRouter from './routes/Url';
//jobs id set

console.log('Manga Eater Server is Starting...\nThis is a index.ts');

const app: Application = express();
const PORT = 11150;

//export const outDir = '/filerun/user-files/out';
export const outDir = './out';

const allowCrossDomain = (
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
};

app.use(allowCrossDomain);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('./page/build'));

/* Main Process */
app.post('/', async (req: Request, res: Response) => {
  const config = utils.loadConf<Config>();
  const { urls, title, ifPush } = req.body;
  let processId = ssm.createFetchJob();
  ssm.setJobsTitle(processId, title);
  ssm.setJobsProgress(processId, 'Analyzing...');
  const titleAndEpisode: string = title;
  const titleAndEpisodeArr = titleAndEpisode.split('-');
  const titleName = titleAndEpisodeArr[0];
  const episode = titleAndEpisodeArr[1];
  const paddedEpisode = utils.padZero(episode);
  const directory = path.join(outDir, titleName, paddedEpisode);
  const timebound = 100;
  const filenames = utils.generateOrderFilenames(urls);
  await utils.downloadImagesWithSSM(
    urls,
    filenames,
    timebound,
    directory,
    ssm,
    processId
  );
  console.log(ifPush);
  if (ifPush) {
    processId = ssm.switchJob(processId);
    ssm.setJobsProgress(processId, 'Pushing... (Preparing)');
    const discord = new Discord(config);
    await discord.login();
    await discord.sendFilesWithSSM(directory, title, 500, ssm, processId);
    discord.killClient();
  } else {
    console.log('No Push');
  }
  ssm.removeJob(processId);
  res.send('Download Complete');
});

//urlからダウンロード
app.use('/url', UrlRouter);


//チャンネル変更
app.post('/channel', async (req: Request, res: Response) => {
  console.log('req.body :', req.body);
  const { index } = req.body;
  utils.changeChannel(index);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
  ssm.setMsg('Operation is completed without problems.(Channel Changed)');
});

//チャンネル追加
app.post('/channel/add', async (req: Request, res: Response) => {
  console.log('add channel');
  const { channelID } = req.body;
  const config = utils.loadConf<Config>();
  //check deplicate
  if (
    config.channel.alt.includes(channelID) ||
    config.channel.current === channelID
  ) {
    ssm.setMsg('Deplicate Channel ID Submitted. Ignore it.');
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  if (await utils.checkChannel(channelID)) {
    ssm.setMsg('Channel ID is valid. Added.');
  } else {
    ssm.setMsg('Channel ID is invalid. Ignore it.');
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  const newConfig = { ...config };
  newConfig.channel.alt.push(channelID);
  utils.writeConf(newConfig);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});
//チャンネル取得
app.get('/channel', (req: Request, res: Response) => {
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});

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
