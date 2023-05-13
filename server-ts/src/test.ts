import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './scrapeUtils';

const url =
  'https://mangarawjp.io/%e4%b8%96%e7%95%8c%e6%9c%80%e5%bc%b7%e3%81%ae%e5%be%8c%e8%a1%9b-%ef%bd%9e%e8%bf%b7%e5%ae%ae%e5%9b%bd%e3%81%ae%e6%96%b0%e4%ba%ba%e6%8e%a2%e7%b4%a2%e8%80%85%ef%bd%9e-raw-free/';

(async () => {
  const { title, urls } = (await utils.scrapeTitlePage(url)) || {
    title: '',
    urls: [],
  };
  console.log('title :', title);
})();
