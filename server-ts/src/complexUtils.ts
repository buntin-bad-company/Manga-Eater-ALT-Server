import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { JSDOM } from 'jsdom';
import puppeteer, { Browser, Page } from 'puppeteer';
import ServerStatusManager from './ServerStatusManager';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';

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
    const url = urls[i];
    const filename = filenames[i];
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
 * 指定された時間後解決する非同期関数
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
  constructor(private config: Config) {
    this.token = this.config.token;
    this.channelID = this.config.channel.current;
  }

  public static async gen() {
    return (await new Discord(loadConf()).login()).waitForReady();
  }

  public async login() {
    this.client.on('ready', () => {});
    await this.client.login(this.token);
    return this;
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

  private getChannelById(id: string) {
    const channel = this.client.channels.cache.get(id);
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

  private async genThreadInChannel(channel_id: string, title: string) {
    const channel = this.getChannelById(channel_id);
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

  public async waitForReady(timebound_ms = 1000) {
    while (!this.client.readyAt) {
      await sleep(timebound_ms);
    }
    return this;
  }

  public async sendFiles(directory: string, title: string, timebound: number) {
    const load = loading('Sending...').start();
    const files = fs.readdirSync(directory);
    load.text = 'Splitting files...';
    let sections = [];
    let section: string[] = [];
    let nowSize = 0;
    for (let i = 0; i < files.length; i++) {
      const current = path.join(directory, files[i]);
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
      await thread.send({ files: sections[i] });
      sleep(timebound);
    }
    load.succeed('send success.');
  }

  public async sendFilesForHelper(
    threadTitle: string,
    timebound: number,
    channel_id: string,
    outDir: string,
    titleIndex: number,
    epIndex: number
  ) {
    const dir = getEpdirByIndexes(outDir, titleIndex, epIndex);
    const files = fs.readdirSync(dir);
    let sections: string[][] = [];
    let section: string[] = [];
    let nowSize = 0;
    for (let i = 0; i < files.length; i++) {
      const current = path.join(dir, files[i]);
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
    await this.waitForReady(500);
    const thread = await this.genThreadInChannel(channel_id, threadTitle);
    try {
      for (let i = 0; i < sections.length; i++) {
        await thread.send({ files: sections[i] });
        sleep(timebound);
      }
    } catch (e) {
      return false;
    }
    return true;
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
      const current = path.join(directory, files[i]);
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
      await thread.send({ files: sections[i] });
      sleep(timebound);
    }
    ssm.setJobsProgress(id, 'Operation Fullfilled.');
  }
  public async sendFilesWithSSMInChannelId(
    directory: string,
    title: string,
    timebound: number,
    ssm: ServerStatusManager,
    id: string,
    channelId: string
  ) {
    const files = fs.readdirSync(directory);
    let sections = [];
    let section: string[] = [];
    let nowSize = 0;
    ssm.setJobsProgress(id, 'Pushing... (Spliting)');
    for (let i = 0; i < files.length; i++) {
      const current = path.join(directory, files[i]);
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
    const thread = await this.genThreadInChannel(channelId, title);
    for (let i = 0; i < sections.length; i++) {
      ssm.setJobsProgress(
        id,
        `Pushing... (${calcPer(i + 1, sections.length)})%`
      );
      await thread.send({ files: sections[i] });
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
      const episodeDir = path.join(directory, episodes[index]);
      load.text = `Sending ${index + 1}/${indexes.length}`;
      thread.send(`第${episodes[index]}話`);
      const files = fs.readdirSync(episodeDir);
      let sections = [];
      let section: string[] = [];
      let nowSize = 0;
      for (let i = 0; i < files.length; i++) {
        const current = path.join(episodeDir, files[i]);
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
        await thread.send({ files: sections[i] });
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
  /**
   * ギルドid,チャンネルidから、そのサーバーにclientがアクセス可能か調べる。
   * @param guild_id ギルドid
   * @param channel_id チャンネルid
   * @returns //{number}  0:アクセス可能 1:ギルドアクセス不可 2:チャンネルアクセス不可
   */
  public async checkIdAvailability(guild_id: string, channel_id: string) {
    await this.waitForReady();
    const guild = this.client.guilds.cache.get(guild_id);
    if (!guild) {
      return 1;
    }
    const channel = guild.channels.cache.get(channel_id);
    if (!channel) {
      return 2;
    }
    return 0;
  }
  public genInviteLink() {
    const url = `https://discord.com/oauth2/authorize?client_id=${this.config.app_id}&scope=applications.commands%20bot`;
    return url;
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

const getTitleAndEpisodes = async (url: string) => {
  try {
    const dom = await JSDOM.fromURL(url);
    const title = dom.window.document.title;
    const temp = title
      //all - to ー
      .replace('-', 'ー')
      .replace(' – Raw 【第', '-')
      .replace('話】', '')
      .replace(/ /g, '');
    const [t, e] = temp.split('-');
    return {
      title: t,
      episode: e,
    };
  } catch (err) {
    return {
      title: 'error',
      episode: 'desu',
    };
  }
};

// scraping 関連
/**
 * チャプターURLから、タイトルと画像URLの配列を取得する。
 * @param url {string} チャプターURL
 * @returns
 */
const generateOrderFilenames = (urls: string[]): string[] =>
  urls.map((url, i) => {
    const imageFormat = url.split('.').pop();
    return `${(i + 1).toString().padStart(4, '0')}.${imageFormat}`;
  });

const autoScroll = async (page: Page) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

const parseTitle = (title: string) => {
  //
  //title episode generate
  const temp = title
    //all - to ー
    .replace('-', 'ー')
    .replace(' – Raw 【第', '-')
    .replace('話】', '')
    .replace(/ /g, '');
  const [titleName, epNum] = temp.split('-');
  const zeroNum = Math.max(integerPart(epNum).length + 1, 4);
  const paddedEpisode = padZero(epNum, zeroNum);
  return [titleName, paddedEpisode];
};

const getTitleName = (outDir: string, titleIndex: number) => {
  const titleName = fs.readdirSync(outDir)[titleIndex];
  return titleName;
};

const getEpdirByIndexes = (
  outDir: string,
  titleIndex: number,
  epIndex: number
) => {
  const dir = outDir;
  const titleName = fs.readdirSync(dir)[titleIndex]; //`${dir}/${titleName}`;
  const titleDir = path.join(dir, titleName);
  const epName = fs.readdirSync(titleDir)[epIndex];
  const epDir = path.join(titleDir, epName); //`${titleDir}/${epName}`;
  return epDir;
};
const integerPart = (str: string) => {
  return str.split('.')[0];
};
/**
 * ファイル名の順序が狂うのを防ぐため、0埋めを行う
 * '1.1' -> '0001.1',
 * '1' -> '0001',
 * '1.123' -> '0001.123'
 * '1102' -> '01102'
 * @param str {string} 変更する前の文字列
 * @param zeros {number} 0埋めする桁数
 * @returns {string} 変更した後の文字列
 */
const padZero = (str: string, zeros: number = 4): string => {
  const parts = str.split('.');
  parts[0] = parts[0].padStart(zeros, '0');
  if (parts[1]) {
    parts[1] = parts[1].padEnd(1 + zeros - parts[0].length, '0');
  }
  return parts.join('.');
};
/**
 * 0埋めを解除する
 * @param str {string} 変更前文字列
 * @returns {string} 変更後文字列
 */
const trimZero = (str: string): string => {
  while (str.startsWith('0')) {
    str = str.slice(1);
  }
  if (str.startsWith('.')) {
    str = '0' + str;
  }
  while (str.endsWith('0') && str.includes('.')) {
    str = str.slice(0, -1);
  }
  if (str.endsWith('.')) {
    str = str.slice(0, -1);
  }
  return str;
};

/**
 * puppeteerを使って、チャプターURLのBodyタグ内のHTMLを取得する。
 * @param url {string} チャプターURL
 * @returns {Promise<string>} JavaScriptが実行された後のBodyタグ内のHTML
 */
const getRenderedBodyContent = async (url: string): Promise<string> => {
  let browser: Browser | undefined;
  let page: Page;

  try {
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
    // User-Agentヘッダーを偽装
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36';
    await page.setUserAgent(userAgent);
    // navigator.webdriverを偽装
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    await autoScroll(page);
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    return bodyHTML;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
const scrapeImageUrlsFromTitleUrl = async (url: string) => {
  const html = await (await fetch(url, requestOps)).text();
  const dom = new JSDOM(html);
  const title = dom.window.document.title;
  const body = await getRenderedBodyContent(url);
  const bodyDom = new JSDOM(body);
  const images = bodyDom.window.document.querySelectorAll('img.image-vertical');
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    urls.push(images[i].getAttribute('data-src') as string);
  }
  return { title, urls };
};

/**
 * 画像のURL,ファイル名,バウンドタイム、保存先ディレクトリを指定することで、URLとファイル名の配列通りの順序で画像を保存する。
 * @param urls {string[]} 画像のURLの配列
 * @param filenames {string[]} 画像のファイル名の配列
 * @param timebound {number} 画像をダウンロードする間隔(ms)
 * @param directory {string} 画像を保存するディレクトリ
 */
const downloadImages = async (
  urls: string[],
  filenames: string[],
  timebound: number,
  directory: string
) => {
  let load = loading('in Image scrape sequence : started').start();
  if (urls.length !== filenames.length) {
    load.fail('in Image scrape sequence : urls.length !== filenames.length');
    throw new Error('urls.length !== filenames.length');
  }
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
    load.text = `in Image scrape sequence : ${i + 1}/${urls.length}`;
    const url = urls[i];
    const filename = filenames[i];
    const img = fetch(url, requestOps);
    const buffer = Buffer.from(await (await img).arrayBuffer());
    fs.writeFileSync(path.join(directory, filename), buffer);
    await sleep(timebound);
  }
  load.succeed('in Image scrape sequence : finished');
};

/**
 * チャプターURL、出力先ディレクトリを指定してスクレイピングを実行する。
 * @param url {string} チャプターのURL(https://mangarawjp.io/chapters/xxxxxx)
 * @param outDir {string} 出力先ディレクトリ(examples: ./out)
 * @returns
 */
const scrapeFromUrl = async (url: string, outDir: string) => {
  const { title, urls } = await scrapeImageUrlsFromTitleUrl(url);
  const filenames = generateOrderFilenames(urls);
  const [titleName, paddedEpisode] = parseTitle(title);
  let directory = prepareDir(path.join(outDir, titleName, paddedEpisode));
  console.log(directory);
  await downloadImages(urls, filenames, 500, directory);
  // ${titleName}-${episode}
  const threadName = `${titleName}-${trimZero(paddedEpisode)}`;
  return { directory, threadName };
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

const log = async (message: string) => {
  const config: Config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  const token = config.token;
  const logChannel = config.logChannel;
  if (!logChannel) return console.log(message);
  const logText = `**${new Date().toLocaleString()}**   ${message}`;
  if (logChannel) {
    try {
      await new REST({ version: '10' })
        .setToken(token)
        .post(Routes.channelMessages(logChannel), {
          body: {
            content: logText,
          },
        });
    } catch (e) {
      console.error(e);
    }
  }
};

const writeRecord = async (prompt: string, record: any) => {
  const config: Config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  const token = config.token;
  const recordChannel = config.record;
  if (!recordChannel) return console.log(record);
  if (recordChannel) {
    try {
      await new REST({ version: '10' })
        .setToken(token)
        .post(Routes.channelMessages(recordChannel), {
          body: {
            content:
              prompt + '```json\n' + JSON.stringify(record, null, 2) + '\n```',
          },
        });
    } catch (e) {
      console.error(e);
    }
  }
};

const scrapeTitlePage = async (url: string) => {
  try {
    const res = await fetch(url, requestOps);
    const text = await res.text();
    const dom = new JSDOM(text);
    const title = dom.window.document.title
      .replace(' (Raw – Free)', '')
      .replace(' ', '');
    const els = dom.window.document.getElementsByClassName('text-info');
    let urls: string[] = [];
    for (let i = 0; i < els.length; i++) {
      els[i].getAttribute('href') &&
        urls.push(els[i].getAttribute('href') as string);
    }
    return { title, urls };
  } catch (e) {
    console.error(e);
    return {
      title: '',
      urls: [],
    };
  }
};

const singleTitleScrape = async (
  task: BCTask,
  ssm: ServerStatusManager,
  type: string,
  url: string,
  outDir: string,
  channelId: string,
  ifPush: boolean
) => {
  let processId = ssm.createFetchJob();
  try {
    const titles = await getTitleAndEpisodes(url);
    ssm.setJobsTitle(processId, `${titles.title}: ${titles.episode}話(BC)`);
    ssm.setJobsProgress(processId, 'Downloading...');
    const { directory: dir, threadName: title } = await scrapeFromUrl(
      url,
      outDir
    );
    if (ifPush) {
      const config = loadConf<Config>();
      const discord = new Discord(config);
      await discord.login();
      processId = ssm.switchJob(processId);
      ssm.setJobsTitle(processId, title);
      ssm.setJobsProgress(processId, 'Pushing... (Preparing)');
      await discord.sendFilesWithSSMInChannelId(
        dir,
        title,
        500,
        ssm,
        processId,
        channelId
      );
    }
  } finally {
    ssm.removeJob(processId);
    writeRecord('[BCHelper]' + type, task);
    return;
  }
};

export {
  singleTitleScrape,
  ServerStatusManager,
  Discord,
  scrapeFromUrl,
  scrapeTitlePage,
  sleep,
  prepareDir,
  calcPer,
  downloadImagesWithSSM,
  loadConf,
  writeConf,
  generateRandomString,
  generateOrderFilenames,
  getTitleAndEpisodes,
  integerPart,
  padZero,
  trimZero,
  log,
  writeRecord,
  getTitleName,
};
