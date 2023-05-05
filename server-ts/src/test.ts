import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './scrapeUtils';

const url =
  'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC12%E8%A9%B1%E3%80%91%E3%82%86%E3%82%8B%E3%82%AD%E3%83%A3%E3%83%B3%E2%96%B3-raw/';

const main = async () => {
  //html scraping
  const res = await fetch(url);

  const text = await res.text();
  //save as html file
  fs.writeFileSync('test.html', text);

  //text is a html string
  const regex = /data-src="([^"]*)"/g;
  const htmlStrings = text.split('\n');
  let match;
  let urls: string[] = [];
  for (const st of htmlStrings) {
    if (st.includes('data-src')) {
      //
      match = regex.exec(st);
      if (match === null) {
        continue;
      }
      const url = match[0].split('"')[1];
      if (url !== null && url !== undefined) {
        urls.push(url);
      } else {
        continue;
      }
    }
  }
  console.log(urls);
  console.log(urls.length);
};

const main2 = async (url: string) => {
  const t = utils.scrapeFromUrl(url, './test');
  console.log(t);
};

const main3 = () => {
  utils.scrapeFromUrl(url, './out');
};

main3();
