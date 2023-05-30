import request from 'request';
import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';
import { JSDOM } from 'jsdom';
import { REST } from 'discord.js';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Routes, RESTPatchAPIWebhookWithTokenMessageJSONBody } from 'discord-api-types/v10';
import {
  ServerStatusManager,
  Discord,
  sleep,
  prepareDir,
  calcPer,
  downloadImagesWithSSM,
  loadConf,
  writeConf,
  getTitleAndEpisodes,
  generateOrderFilenames,
  scrapeFromUrl,
  padZero,
  trimZero
} from '../complexUtils';


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


const fetchChannelName = async (token: string, channelID: string) => {
  const name: string = await new Promise((resolve, reject) => {
    request(
      `https://discord.com/api/channels/${ channelID }`,
      {
        headers: {
          Authorization: `Bot ${ token }`,
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
/**
 * checkedの配列から、checkedで指定されている全でぃれくとりのリストを返す
 * @param checked checkedのリスト
 * @param outDir ベースとなるoutディレクトリ
 * @returns checkedで指定されているディレクトリのリスト
 */
const getDirList = (checked: Checked[], outDir: string) => {
  let rmDirs: string[] = [];
  for (let c = 0; c < checked.length; c++) {
    const dir = path.join(outDir, fs.readdirSync(outDir)[checked[c].index]);
    for (const index of checked[c].checked) {
      rmDirs.push(path.join(dir, fs.readdirSync(dir)[index]));
    }
  }
  return rmDirs;
};

/**
 * interactionを返す。
 */
const respondInteraction = async (app_id: string, token: string, data: RESTPatchAPIWebhookWithTokenMessageJSONBody) => {
  await fetch(`https://discord.com/api/v10/webhooks/${ app_id }/${ token }/messages/@original`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  },
  );
}

export {
  Discord,
  loadConf,
  writeConf,
  scrapeFromUrl,
  scrapeTitlePage,
  calcPer,
  sleep,
  padZero,
  trimZero,
  getDirList,
  changeChannel,
  fetchChannels,
  checkChannel,
  getTitleAndEpisodes,
  downloadImagesWithSSM,
  generateOrderFilenames,
  ServerStatusManager,
  respondInteraction
};
