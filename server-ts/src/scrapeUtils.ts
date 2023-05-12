import request from 'request';
import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';
import { JSDOM } from 'jsdom';
import { Channel, GuildChannelTypes, REST } from 'discord.js';
import { Routes, GuildChannelType } from 'discord-api-types/v10';
import puppeteer, { Browser, Page } from 'puppeteer';
import ServerStatusManager from './ServerStatusManager';

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

/**
 * 指定された時間待機する非同期関数
 * @param ms {number} 待機時間(ms)
 * @returns {Promise<void>}
 */
const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return;
};
/**
 * ファイル名の順序が狂うのを防ぐため、0埋めを行う
 * '1.1' -> '0001.1',
 * '1' -> '0001',
 * '1.123' -> '0001.123'
 * @param str {string} 変更する前の文字列
 * @returns {string} 変更した後の文字列
 */
const padZero = (str: string): string => {
  const parts = str.split('.');
  parts[0] = parts[0].padStart(4, '0');
  if (parts[1]) {
    parts[1] = parts[1].padEnd(1 + 4 - parts[0].length, '0');
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
  discordLogger(`${urls.length} images downloaded to ${directory}`);
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
  discordLogger(`${id} process fullfilled. client will be destroyed.`);
  await sleep(700);
};

const calcPer = (numerator: number, denominator: number): number => {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero.');
  }

  let percentage = (numerator / denominator) * 100;
  return Math.round(percentage);
};

const generateOrderFilenames = (urls: string[]): string[] =>
  urls.map((url, i) => {
    const imageFormat = url.split('.').pop();
    return `${(i + 1).toString().padStart(4, '0')}.${imageFormat}`;
  });

const fetchChannelName = async (token: string, channelID: string) => {
  const name: string = await new Promise((resolve, reject) => {
    request(
      `https://discord.com/api/channels/${channelID}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      },
      (err, _res, body) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(body).name);
        }
      }
    );
  });
  return name;
};

const saveAsJson = (data: any, filename: string) => {
  //if the file is exist, overwrite it.
  fs.writeFileSync(filename, JSON.stringify(data, null, 4));
};
const loadConf = <T>(): T => {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf8')) as T;
  return config;
};

const writeConf = <T>(config: T) => {
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
};

/**
 * 引数dirに指定されたディレクトリが存在しない場合、作成する。
 * @param dir {string} 作成するディレクトリのパス
 * @returns {string} 作成したディレクトリのパス
 */
const prepareDir = (dir: string) => {
  dir.split(path.sep).reduce((prevPath, folder) => {
    const currentPath = path.join(prevPath, folder, path.sep);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
    return currentPath;
  }, '');
  return dir;
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
  const channelNames = { currentName, alt: altNames };
  newConfig.channelNames = channelNames;
  return newConfig;
};

const changeChannel = (index: number) => {
  const config = loadConf<Config>();
  const newCurrent = config.channel.alt[index];
  const prevCurrent = config.channel.current;
  const newConfig = { ...config };
  newConfig.channel.current = newCurrent;
  newConfig.channel.alt[index] = prevCurrent;
  writeConf(newConfig);
};

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
    discordLogger(
      `finished puppeteer on ${decodeURI(url)} . client destroyed.`
    );
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

/**
 * チャプターURLから、タイトルと画像URLの配列を取得する。
 * @param url {string} チャプターURL
 * @returns
 */
const scrapeImageUrlsFromTitleUrl = async (url: string) => {
  const html = await (await fetch(url, requestOps)).text();
  const dom = new JSDOM(html);
  const title = dom.window.document.title;
  discordLogger(`started scraping ${title}`);
  const body = await getRenderedBodyContent(url);
  const bodyDom = new JSDOM(body);
  const images = bodyDom.window.document.querySelectorAll('img.image-vertical');
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    urls.push(images[i].getAttribute('data-src') as string);
  }
  return { title, urls };
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
  const paddedEpisode = padZero(epNum);
  return [titleName, paddedEpisode];
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
  discordLogger(`downloaded ${threadName}`);
  return { directory, threadName };
};

const scrapeFromUrlWithSSM = async (
  url: string,
  outDir: string,
  ssm: ServerStatusManager,
  processId: string
) => {
  ssm.setJobsTitle(processId, 'fetching...');
  ssm.setJobsProgress(processId, 'Analyzing...');
  const { title, urls } = await scrapeImageUrlsFromTitleUrl(url);
  const filenames = generateOrderFilenames(urls);
  const [titleName, paddedEpisode] = parseTitle(title);
  ssm.setJobsTitle(processId, `${titleName}-${trimZero(paddedEpisode)}`);
  let directory = prepareDir(path.join(outDir, titleName, paddedEpisode));
  console.log(directory);
  await downloadImagesWithSSM(urls, filenames, 500, directory, ssm, processId);
  // ${titleName}-${episode}
  const threadName = `${titleName}-${trimZero(paddedEpisode)}`;
  discordLogger(`downloaded ${threadName}`);
  return { directory, threadName };
};

const scrapeTitlePage = async (url: string) => {
  try {
    const res = await fetch(url, requestOps);
    const text = await res.text();
    const dom = new JSDOM(text);
    const els = dom.window.document.getElementsByClassName('text-info');
    let urls: string[] = [];
    for (let i = 0; i < els.length; i++) {
      els[i].getAttribute('href') &&
        urls.push(els[i].getAttribute('href') as string);
    }
    return urls;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const discordLogger = async (message: string) => {
  const config = loadConf<Config>();
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

const checkChannel = async (channelID: string) => {
  const config = loadConf<Config>();
  const token = config.token;
  try {
    const channel = (await new REST({ version: '10' })
      .setToken(token)
      .get(Routes.channel(channelID))) as any;
    if (channel.id === channelID) return true;
  } catch (e) {
    return false;
  }
};

interface ChannelInfo {
  currentName: string;
  alt?: string[];
}

interface Archive {
  title: string;
  episodes: string[];
}
interface DirectoryOutbound {
  titles: string[];
  outbound: Archive[];
}
interface Checked {
  index: number;
  checked: number[];
}

interface Config {
  token: string;
  channel: {
    current: string;
    alt: string[];
  };
  channelNames?: ChannelInfo;
  logChannel?: string;
}

export {
  checkChannel,
  trimZero,
  saveAsJson,
  padZero,
  discordLogger,
  scrapeTitlePage,
  Checked,
  sleep,
  downloadImages,
  generateOrderFilenames,
  fetchChannelName,
  loadConf,
  writeConf,
  fetchChannels,
  changeChannel,
  scrapeImageUrlsFromTitleUrl,
  scrapeFromUrl,
  prepareDir,
  getRenderedBodyContent,
  downloadImagesWithSSM,
  calcPer,
  scrapeFromUrlWithSSM,
};

export type { Config, ChannelInfo, Archive, DirectoryOutbound };
