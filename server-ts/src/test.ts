import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './scrapeUtils';

(async () => {
  const message = 'Logger Test Message';
  utils.discordLogger(message);
})();

const t = ['1', '100', '3.3'];

const t2 = t.map((e) => {
  return utils.padZero(e);
});

console.log(t2);
