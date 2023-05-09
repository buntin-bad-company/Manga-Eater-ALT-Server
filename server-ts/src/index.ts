import express, { Application, Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import fs from 'fs';
import path from 'path';
import * as utils from './scrapeUtils';
import type { Config, DirectoryOutbound, Checked } from './scrapeUtils';
import Discord from './Discord';

console.log('Manga Eater Server is Starting...\nThis is a index.ts');

const app: Application = express();
const PORT = 11150;

interface CorsFunc {
  (req: Request, res: Response, next: Function): void;
}

interface ServerStatus {
  state: 'idle' | 'busy' | 'error';
  message: string;
}

const outDir = '/filerun/user-files/out';
//const outDir = './out';
const allowCrossDomain: CorsFunc = (req, res, next) => {
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

// "/" => "index.html"
app.use(express.static('./page/build'));

/* Main Process */
app.post('/', async (req: Request, res: Response) => {
  sendStatus({ state: 'busy', message: 'Single Page Scraping Started.' });
  const config = utils.loadConf<Config>();
  const { urls, title, ifPush } = req.body;
  const titleAndEpisode: string = title;
  const titleAndEpisodeArr = titleAndEpisode.split('-');
  const titleName = titleAndEpisodeArr[0];
  const episode = titleAndEpisodeArr[1];
  const paddedEpisode = utils.padZero(episode);
  const directory = path.join(outDir, titleName, paddedEpisode);
  const timebound = 100;
  const filenames = utils.generateOrderFilenames(urls);
  await utils.downloadImages(urls, filenames, timebound, directory);
  console.log(ifPush);
  if (ifPush) {
    sendStatus({
      state: 'busy',
      message: `Single Page Scraping Finished.\nPush to ${
        config.channelNames?.currentName || 'unknown'
      }`,
    });
    const discord = new Discord(config);
    await discord.login();
    await discord.sendFiles(directory, title, 500);
    discord.killClient();
  } else {
    console.log('No Push');
  }
  sendStatus({
    state: 'idle',
    message: 'Operation is completed without problems.',
  });
  res.send('Download Complete');
});

/**
 * チャプターURLから画像をDLし、ifPushがtrueならdiscordに送信する
 * @param url {string} mangarawjp.ioのチャプターurl
 * @param ifPush
 */
const dlHelperFromURL = async (url: string, ifPush: boolean) => {
  const { directory: dir, threadName: title } = await utils.scrapeFromUrl(
    url,
    outDir
  );
  if (ifPush) {
    const config = utils.loadConf<Config>();
    const discord = new Discord(config);
    await discord.login();
    await discord.sendFiles(dir, title, 500);
  }
};

//urlからダウンロード
app.post('/url', async (req: Request, res: Response) => {
  console.log('req.body :', req.body);
  const { url, ifPush } = req.body;
  const urlString = url as string;
  if (urlString.includes('chapter')) {
    //URLがチャプターURLの場合
    sendStatus({
      state: 'busy',
      message: 'Single Page Scraping from URL started',
    });
    await dlHelperFromURL(urlString, ifPush);
  } else {
    //URLがタイトルURLの場合
    sendStatus({
      state: 'busy',
      message: 'Multi Page Scraping from URL started',
    });
    const titlePageUrls = await utils.scrapeTitlePage(urlString);
    const len = titlePageUrls.length;
    for (let i = 0; i < len; i++) {
      sendStatus({
        state: 'busy',
        message: `Scraping sequence is in progress...(${i + 1}/${len})`,
      });
      try {
        await dlHelperFromURL(titlePageUrls[i], false);
      } catch (e) {
        sendStatus({
          state: 'error',
          message: `Error occured while scraping ${titlePageUrls[i]}`,
        });
        res.send('Error Occured');
        return;
      }
      sendStatus({
        state: 'busy',
        message: `Scraping sequence is waiting with timebound(${i + 1}/${len})`,
      });
      await utils.sleep(1000 * 60 * 1);
    }
  }
  sendStatus({
    state: 'idle',
    message: 'Operation is completed without problems.',
  });
  res.send('Download Complete');
});

//チャンネル変更
app.post('/channel', async (req: Request, res: Response) => {
  console.log('req.body :', req.body);
  const { index } = req.body;
  utils.changeChannel(index);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
  sendStatus({
    state: 'idle',
    message: 'Operation is completed without problems.',
  });
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
    sendStatus({
      state: 'idle',
      message: 'Deplicate Channel ID Submitted. Ignore it.',
    });
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  if (await utils.checkChannel(channelID)) {
    sendStatus({
      state: 'idle',
      message: 'Channel ID is valid. Add it to config.',
    });
  } else {
    sendStatus({
      state: 'idle',
      message: 'Channel ID is invalid. Ignore it.',
    });
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

// directory 構造
app.get('/directory', (req: Request, res: Response) => {
  const directory = outDir;
  let out: DirectoryOutbound = { titles: [], outbound: [] };
  const titles = fs.readdirSync(directory);
  titles.forEach((title) => {
    //if directory is empty, remove it
    if (fs.readdirSync(`${directory}/${title}`).length === 0) {
      fs.rmdirSync(`${directory}/${title}`);
      return;
    }
    out.titles.push(title);
    let episodes: string[] = [];
    const episodePaths = fs.readdirSync(`${directory}/${title}`); //[1,2,3,4...]みたいな
    episodePaths.forEach((episode) => {
      const count = fs.readdirSync(`${directory}/${title}/${episode}`).length; //"./out/title/${episode}/*"の個数
      episodes.push(`${episode}-${count}`);
    });
    out.outbound.push({
      title,
      episodes,
    });
  });
  res.send(out);
});

//複数push
app.post('/directory', async (req: Request, res: Response) => {
  sendStatus({
    state: 'busy',
    message: 'Multiple Episode Pushing Started',
  });
  const config = utils.loadConf<Config>();
  const checked: Checked[] = req.body;
  const discord = new Discord(config);
  await discord.login();
  await utils.sleep(3000);
  const len = checked.length;
  let count = 1;
  for (const check of checked) {
    sendStatus({
      state: 'busy',
      message: `Pushing sequence is in progress...(${count++}/${len})`,
    });
    const dir = outDir;
    const title = fs.readdirSync(dir)[check.index];
    const epDir = `${dir}/${title}`;
    const episodes = fs.readdirSync(epDir);
    const episodeIndex = check.checked;
    const threadName = `${title}第${utils.trimZero(
      episodes[episodeIndex[0]]
    )}-${utils.trimZero(episodes[episodeIndex[episodeIndex.length - 1]])}話`;
    await discord.sendText(threadName);
    await discord.sendMultipleEpisodes(epDir, check.checked, 500, threadName);
  }
  sendStatus({
    state: 'idle',
    message: 'Operation is completed without problems.',
  });
  discord.killClient();
  res.send('ok');
});

//複数削除
app.delete('/directory', async (req: Request, res: Response) => {
  sendStatus({ state: 'busy', message: '削除中...' });
  const checked: Checked[] = req.body;
  let rmHistory = '';
  let c = 1;
  for (const check of checked) {
    sendStatus({
      state: 'busy',
      message: `削除中...${c}/${checked.length}`,
    });
    const dir = outDir;
    const title = fs.readdirSync(dir)[check.index];
    rmHistory += `${title}(`;
    const epDir = `${dir}/${title}`;
    const episodes = fs.readdirSync(epDir);
    const episodeIndex = check.checked;
    for (const index of episodeIndex) {
      rmHistory += ` ${episodes[index]},`;
      const episode = episodes[index];
      const episodeDir = `${epDir}/${episode}`;
      const files = fs.readdirSync(episodeDir);
      for (const file of files) {
        fs.unlinkSync(`${episodeDir}/${file}`);
      }
      fs.rmdirSync(episodeDir);
    }
    rmHistory += '), ';
    c++;
  }
  sendStatus({
    state: 'idle',
    message: `削除完了:${rmHistory}`,
  });
  res.send('all done');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

let status: ServerStatus = {
  state: 'idle',
  message: 'Hello, World',
};

const sendStatus = (payload: ServerStatus) => {
  status.message = payload.message;
  status.state = payload.state;
  io.emit('status', status);
};

io.on('connection', (socket) => {
  console.log('A client has connected.');
  socket.emit('status', status);
  socket.on('disconnect', () => {
    console.log('A client has disconnected.');
  });
});

try {
  server.listen(PORT, () => {
    console.log(`Manga Eater Server Started in : http://localhost:${PORT}/`);
  });
} catch (e) {
  sendStatus({ state: 'error', message: (e as Error).message });
  if (e instanceof Error) {
    console.error(e.message);
  }
}
