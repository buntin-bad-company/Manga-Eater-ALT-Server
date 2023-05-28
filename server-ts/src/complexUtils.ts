import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';
import {Client, GatewayIntentBits, TextChannel} from 'discord.js';
import ServerStatusManager from './ServerStatusManager';

/**
 * 引数dirに指定されたディレクトリが存在しない場合、作成する。
 * @param dir {string} 作成するディレクトリのパス
 * @returns {string} 作成したディレクトリのパス
 */
const prepareDir = (dir: string): string => {
  dir.split(path.sep).reduce((prevPath, folder) => {
    const currentPath = path.join(prevPath, folder, path.sep);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
    return currentPath;
  }, '');
  return dir;
};

const downloadImagesWithSSM = async (
  urls: string[],
  filenames: string[],
  timebound: number,
  directory: string,
  ssm: ServerStatusManager,
  id: string
) => {
  if (urls.length !== filenames.length) {
    throw new Error('urls.length !== filenames.length');
  }
  ssm.setJobsProgress(id, `Fetching...(${0})%`);
  //if directory does not exist, create it.
  prepareDir(directory);
  const requestOps: RequestInit = {
    method: 'GET',
    headers: {
      accept:
        'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language':
        'ja-JP,ja;q=0.9,en-US;q=0.8,en-GB;q=0.7,en-IN;q=0.6,en-AU;q=0.5,en-CA;q=0.4,en-NZ;q=0.3,en-ZA;q=0.2,en;q=0.1',
      referer: 'https://mangarawjp.io/',
      'sec-ch-ua':
        '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': 'Windows',
      'sec-fetch-dest': 'image',
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'cross-site',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    },
  };
  for (let i = 0; i < urls.length; i++) {
    const p = calcPer(i, urls.length);
    ssm.setJobsProgress(id, `Fetching... (${p})%`);
    const url = urls[ i ];
    const filename = filenames[ i ];
    const img = fetch(url, requestOps);
    const buffer = Buffer.from(await (await img).arrayBuffer());
    fs.writeFileSync(path.join(directory, filename), buffer);
    await sleep(timebound);
  }
  await sleep(700);
};

const calcPer = (numerator: number, denominator: number): number => {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero.');
  }

  let percentage = (numerator / denominator) * 100;
  return Math.round(percentage);
};
/**
 * 指定された時間待機する非同期関数
 * @param ms {number} 待機時間(ms)
 * @returns {Promise<void>}
 */
const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return;
};
class Discord {
  private client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });
  private token = '';
  private channelID = '';
  constructor(config: Config) {
    this.token = config.token;
    this.channelID = config.channel.current;
  }
  public async login() {
    this.client.on('ready', () => {});
    await this.client.login(this.token);
  }

  private get channel() {
    const channel = this.client.channels.cache.get(this.channelID);
    if (!channel) {
      throw new Error('Channel not found.');
    } else if (!(channel instanceof TextChannel)) {
      throw new Error('Channel is not a text channel.');
    }
    return channel;
  }

  private async thread(title: string) {
    const channel = this.channel;
    const thread = await channel.threads.create({
      name: title,
      autoArchiveDuration: 1440,
    });
    return thread;
  }

  public killClient() {
    this.client.destroy();
    console.log('Client destroyed.');
  }

  private async waitForReady() {
    while (!this.client.readyAt) {
      await sleep(1000);
    }
  }

  public async sendFiles(directory: string, title: string, timebound: number) {
    const load = loading('Sending...').start();
    const files = fs.readdirSync(directory);
    load.text = 'Splitting files...';
    let sections = [];
    let section: string[] = [];
    let nowSize = 0;
    for (let i = 0; i < files.length; i++) {
      const current = path.join(directory, files[ i ]);
      if (
        nowSize + fs.statSync(current).size > 24000000 ||
        section.length == 10
      ) {
        sections.push(section);
        nowSize = 0;
        section = [];
      }
      section.push(current);
      nowSize += fs.statSync(current).size;
      if (i == files.length - 1) {
        sections.push(section);
      }
    }
    // if client is not ready, wait for ready
    load.text = 'Waiting for ready...';
    await this.waitForReady();
    load.text = 'Sending...';
    const thread = await this.thread(title);
    for (let i = 0; i < sections.length; i++) {
      load.text = `Sending ${i + 1}/${sections.length}`;
      await thread.send({files: sections[ i ]});
      sleep(timebound);
    }
    load.succeed('send success.');
  }

  public async sendFilesWithSSM(
    directory: string,
    title: string,
    timebound: number,
    ssm: ServerStatusManager,
    id: string
  ) {
    const files = fs.readdirSync(directory);
    let sections = [];
    let section: string[] = [];
    let nowSize = 0;
    ssm.setJobsProgress(id, 'Pushing... (Spliting)');
    for (let i = 0; i < files.length; i++) {
      const current = path.join(directory, files[ i ]);
      if (
        nowSize + fs.statSync(current).size > 24000000 ||
        section.length == 10
      ) {
        sections.push(section);
        nowSize = 0;
        section = [];
      }
      section.push(current);
      nowSize += fs.statSync(current).size;
      if (i == files.length - 1) {
        sections.push(section);
      }
    }
    // if client is not ready, wait for ready
    ssm.setJobsProgress(id, 'Pushing... (Client is not Ready)');
    await this.waitForReady();
    const thread = await this.thread(title);
    for (let i = 0; i < sections.length; i++) {
      ssm.setJobsProgress(
        id,
        `Pushing... (${calcPer(i + 1, sections.length)})%`
      );
      await thread.send({files: sections[ i ]});
      sleep(timebound);
    }
    ssm.setJobsProgress(id, 'Operation Fullfilled.');
  }

  public async sendMultipleEpisodes(
    directory: string,
    indexes: number[],
    timebound: number,
    threadName: string
  ) {
    const episodes = fs.readdirSync(directory);
    let load = loading('Sending...').start();
    const thread = await this.thread(threadName);
    for (const index of indexes) {
      const episodeDir = path.join(directory, episodes[ index ]);
      load.text = `Sending ${index + 1}/${indexes.length}`;
      thread.send(`第${episodes[ index ]}話`);
      const files = fs.readdirSync(episodeDir);
      let sections = [];
      let section: string[] = [];
      let nowSize = 0;
      for (let i = 0; i < files.length; i++) {
        const current = path.join(episodeDir, files[ i ]);
        if (
          nowSize + fs.statSync(current).size > 24000000 ||
          section.length == 10
        ) {
          sections.push(section);
          nowSize = 0;
          section = [];
        }
        section.push(current);
        nowSize += fs.statSync(current).size;
        if (i == files.length - 1) {
          sections.push(section);
        }
      }
      for (let i = 0; i < sections.length; i++) {
        load.text = `Sending ${i + 1}/${sections.length}`;
        await thread.send({files: sections[ i ]});
        sleep(timebound);
      }
      load = load
        .succeed(`send success.${index + 1}/${indexes.length}`)
        .start();
    }
    load.succeed(`send success.${indexes.length} episodes sent.`);
  }

  public async sendText(text: string) {
    const channel = this.channel;
    await channel.send(text);
  }
}
/**
 * 指定された方にパースしconfig.jsonを読み込む。
 * @returns {T} config
 */
const loadConf = <T>(): T => {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf8')) as T;
  return config;
};
/**
 *
 * @param config config.jsonに書き込むobject
 */
const writeConf = <T>(config: T) => {
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
};

const generateRandomString = (length: number) => {
  let result = '';
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const requestOps: RequestInit = {
  method: 'GET',
  headers: {
    accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language':
      'ja-JP,ja;q=0.9,en-US;q=0.8,en-GB;q=0.7,en-IN;q=0.6,en-AU;q=0.5,en-CA;q=0.4,en-NZ;q=0.3,en-ZA;q=0.2,en;q=0.1',
    referer: 'https://mangarawjp.io/',
    'sec-ch-ua':
      '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': 'Windows',
    'sec-fetch-dest': 'image',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'cross-site',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  },
};

export {
  ServerStatusManager,
  Discord,
  sleep,
  prepareDir,
  calcPer,
  downloadImagesWithSSM,
  loadConf,
  writeConf,
  generateRandomString,
};
