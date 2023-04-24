import * as utils from './scrapeUtils';
import fs from 'fs';

(async () => {
    const siteUrl =
        'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC2%E8%A9%B1%E3%80%91%E3%81%B5%E3%82%8F%E3%81%B5%E3%82%8F%E3%83%8F%E3%82%B3%E3%82%B9%E3%82%BF%E3%83%BC-raw/';

    const urls = await utils.generateUrls(siteUrl);
    const filenames = utils.generateStaticFilenames(urls);
    const directory = './out/test';
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    await utils.downloadImages(urls, filenames, 1000, directory);
})();
