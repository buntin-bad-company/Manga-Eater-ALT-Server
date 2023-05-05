import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './scrapeUtils';

(async () => {
  const url = 'https://mangarawjp.io/%e8%a1%80%e3%81%ae%e8%bd%8d-raw-free/';
  const t = await utils.scrapeTitlePage(url);
  console.log(t);
})();
