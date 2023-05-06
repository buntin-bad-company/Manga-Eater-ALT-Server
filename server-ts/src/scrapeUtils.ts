import request from 'request';
import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';
import { JSDOM } from 'jsdom';

const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return;
};

const padZero = (str: string) => {
  const parts = str.split('.');
  parts[0] = parts[0].padStart(4, '0');
  if (parts[1]) {
    parts[1] = parts[1].padEnd(1 + 4 - parts[0].length, '0');
  }
  return parts.join('.');
};

const trimZero = (str: string) => {
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
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
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

const generateOrderFilenames = (urls: string[]) => {
  const filenames: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const imageFormat = urls[i].split('.').pop();
    // 001 002, 003, ...
    filenames.push(`${(i + 1).toString().padStart(3, '0')}.${imageFormat}`);
  }
  return filenames;
};

const saveAsJson = (data: any, filename: string) => {
  //if the file is exist, overwrite it.
  fs.writeFileSync(filename, JSON.stringify(data, null, 4));
};

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
const loadConf = <T>(): T => {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf8')) as T;
  return config;
};

const writeConf = <T>(config: T) => {
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
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

const getUrlFromUrls = async (url: string) => {
  const html = await (await fetch(url)).text();
  const dom = new JSDOM(html);
  const images = dom.window.document.querySelectorAll('img.image-vertical');
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    urls.push(images[i].getAttribute('data-src') as string);
  }
  const title = dom.window.document.title;
  return { title, urls };
};

const scrapeFromUrl = async (url: string, outDir: string) => {
  const { title, urls } = await getUrlFromUrls(url);
  const filenames = generateOrderFilenames(urls);
  //title episode generate
  const temp = title
    //all - to ー
    .replace('-', 'ー')
    .replace(' – Raw 【第', '-')
    .replace('話】', '')
    .replace(/ /g, '');
  const titleAndEpisodeArr = temp.split('-');
  const titleName = titleAndEpisodeArr[0];
  const episode = titleAndEpisodeArr[1];
  const paddedEpisode = padZero(episode);
  let directory = prepareDir(path.join(outDir, titleName, paddedEpisode));
  console.log(directory);
  await downloadImages(urls, filenames, 500, directory);
  // ${titleName}-${episode}
  const threadName = `${titleName}-${episode}`;
  discordLogger(`downloaded ${threadName}`);
  return { directory, threadName };
};

const scrapeTitlePage = async (url: string) => {
  try {
    const res = await fetch(url);
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

interface Config {
  token: string;
  channel: {
    current: string;
    alt: string[];
  };
  channelNames?: ChannelInfo;
}

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

const discordLogger = async (message: string) => {
  const config = loadConf<Config>();
  const token = config.token;
  const logChannel = config.logChannel;
  const logText = `**${new Date().toLocaleString()}**   ${message}`;
  if (logChannel) {
    fetch(`https://discord.com/api/channels/${logChannel}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: logText }),
    });
  }
};

export {
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
  getUrlFromUrls,
  scrapeFromUrl,
  prepareDir,
};

export type { Config, ChannelInfo, Archive, DirectoryOutbound };
