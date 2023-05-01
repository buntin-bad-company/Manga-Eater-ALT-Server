import { sleep, loadConf, writeConf } from './scrapeUtils';
import fs from 'fs';
import { fetchChannelName } from './scrapeUtils';
import type { Config } from './scrapeUtils';

const config: Config = loadConf();

console.log(JSON.stringify(config, null, 2));

const main = async (config: Config) => {
  console.log(config);
};

main(config);
