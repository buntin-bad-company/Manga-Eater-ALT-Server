import { sleep, saveAsJson } from './scrapeUtils';
import fs from 'fs';
import { Builder } from 'selenium-webdriver';
import loading from 'loading-cli';

/* async () => {
    const inbound = JSON.parse(fs.readFileSync('./test.json', 'utf8'));
    const { title, url } = inbound;
    console.log('inbound');
    console.log(JSON.stringify(inbound, null, 2));
    const directory = `./out/${title}`;
    const urls = await utils.generateUrls(url);
    const filenames = utils.generateOrderFilenames(urls);
    await utils.downloadImages(urls, filenames, 1000, directory);
}; */

(async (baseUrl: string) => {
    const load = loading('in Image scrape sequence : started').start();
    let driver = await new Builder().forBrowser('chrome').build();
    await driver.get(baseUrl);
    const title = await driver.getTitle();
    load.text = `in Image scrape sequence : title scraped : ${title}`;
    const html = await driver.getPageSource();
    saveAsJson({ title, url: baseUrl, html }, `./out/${title}.json`);
    /* load.text = `in Image scrape sequence : scraped ${urls.length} images`;
    load.succeed('in Image scrape sequence : finished');
    return urls; */
    const urls: string[] = [];
    return urls;
})(
    'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC67%E8%A9%B1%E3%80%91%E6%80%9C-Toki--raw/'
);
