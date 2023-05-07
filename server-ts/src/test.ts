import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './scrapeUtils';

const url =
  'https://mangarawjp.io/chapters/%e3%80%90%e7%ac%ac3%e8%a9%b1%e3%80%91%e3%83%81%e3%80%82%e2%88%92%e5%9c%b0%e7%90%83%e3%81%ae%e9%81%8b%e5%8b%95%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6%e2%88%92-raw/';
(async () => {
  /* const domString = await utils.getRenderedBodyContent(url);
  console.log(domString);
  //save as file
  fs.writeFileSync('test.html', domString); */
  utils.discordLogger('test');
})();
