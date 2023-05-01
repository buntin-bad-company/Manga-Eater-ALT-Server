import express, { Application, Request, Response } from 'express';
import { Checked } from './scrapeUtils';
import Discord from './Discord';
import fs from 'fs';

interface ChannelInfo {
  currentName: string;
  alt?: string[];
}
interface Config {
  token: string;
  channel: {
    current: string;
    alt: string[];
  };
  channelNames?: ChannelInfo;
}
console.log('Manga Eater Server is Starting...\nThis is a mockup.ts');
//listen to port 3000
//print request body mock server
const app: Application = express();
const PORT = 11150;

/* from here The mock functions of scrapeUtils.ts */
const loadConf = <T>(): T => {
  const config = JSON.parse(fs.readFileSync('./config.mock.json', 'utf8')) as T;
  return config;
};
const writeConf = <T>(config: T) => {
  fs.writeFileSync('./config.mock.json', JSON.stringify(config, null, 2));
};
const fetchChannelName = async (token: string, channelID: string) => {
  switch (channelID) {
    case '1092900938592829471':
      return '漫画raw';
    case '1092355756378030081':
      return 'ゲーム';
    case '1067928311310852126':
      return 'lsmrd';
    default:
      //throw error
      throw new Error('channelID is not valid');
  }
};
const fetchChannels = async () => {
  const config = loadConf<Config>();
  const token = config.token;
  const currentName = await fetchChannelName(token, config.channel.current);
  const altNames = await Promise.all(
    config.channel.alt.map(async (channelId) => {
      const name = await fetchChannelName(token, channelId);
      return name;
    })
  );
  const newConfig: Config = { ...config };
  const channelNames: ChannelInfo = { currentName, alt: altNames };
  newConfig.channelNames = channelNames;
  return newConfig;
};
const changeChannel_mock = (index: number) => {
  console.log('index :', index);
  const config = loadConf<Config>();
  const newCurrent = config.channel.alt[index];
  const prevCurrent = config.channel.current;
  const newConfig = { ...config };
  newConfig.channel.current = newCurrent;
  newConfig.channel.alt[index] = prevCurrent;
  console.log('newConfig :', newConfig);
  writeConf(newConfig);
};

/* mock functions end */

interface Archive {
  title: string;
  episodes: string[];
}
interface DirectoryOutbound {
  titles: string[];
  outbound: Archive[];
}

interface CorsFunc {
  (req: Request, res: Response, next: Function): void;
}

const allowCrossDomain: CorsFunc = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, access_token'
  );
  if ('OPTIONS' === req.method) {
    res.send(200);
  } else {
    next();
  }
};

app.use(allowCrossDomain);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (_req: Request, res: Response) => {
  res.send('Manga Eater Server is Ready.');
});
app.post('/', async (req: Request, res: Response) => {
  const body = JSON.stringify(req.body, null, 4);
  console.log(body);
  res.send('Server accept the request.');
});
app.get('/channel', (req: Request, res: Response) => {
  //sleep for 1 sec
  fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});
app.post('/channel', async (req: Request, res: Response) => {
  console.log('req.body :', req.body);
  const { index } = req.body;
  //change channel
  console.log('change channel');
  changeChannel_mock(index);
  fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});
app.post('/channel/add', async (req: Request, res: Response) => {
  console.log('add channel');
  const { channelID } = req.body;
  const config = loadConf<Config>();
  //check deplicate
  if (
    config.channel.alt.includes(channelID) ||
    config.channel.current === channelID
  ) {
    console.log('deplicate');
    fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  //check id is active(TODO)
  const newConfig = { ...config };
  newConfig.channel.alt.push(channelID);
  writeConf(newConfig);
  fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});

app.get('/directory', (req: Request, res: Response) => {
  const directory = './out';
  let out: DirectoryOutbound = { titles: [], outbound: [] };
  const titles = fs.readdirSync(directory);
  titles.forEach((title) => {
    out.titles.push(title);
    let episodes: string[] = [];
    const episodePaths = fs.readdirSync(`${directory}/${title}`);
    episodePaths.forEach((episode) => {
      const count = fs.readdirSync(`${directory}/${title}/${episode}`).length;
      episodes.push(`${episode}-${count}`);
    });
    out.outbound.push({
      title,
      episodes,
    });
  });
  res.send(out);
});

app.post('/directory', async (req: Request, res: Response) => {
  const config = loadConf<Config>();
  const checked: Checked[] = req.body;
  const discord = new Discord(config);
  await discord.login();
  for (const check of checked) {
    const dir = './out';
    const title = fs.readdirSync(dir)[check.index];
    await discord.sendText(title);
    const episodes = fs.readdirSync(`${dir}/${title}`);
    const episodeIndex = check.checked;
    for (const index of episodeIndex) {
      await discord.sendText(`${episodes[index]}話`);
      const episode = episodes[index];
      await discord.sendFiles(`${dir}/${title}/${episode}`, title, 500);
    }
  }
  discord.killClient();
});

try {
  app.listen(PORT, () => {
    console.log(`server start at : http://localhost:${PORT}`);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
