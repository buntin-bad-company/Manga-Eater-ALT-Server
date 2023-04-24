import request from 'request';
import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';
import {
    Builder,
    By,
    Capabilities,
    Key,
    until,
    WebDriver,
} from 'selenium-webdriver';
const capabilities: Capabilities = Capabilities.chrome();
capabilities.set('chromeOptions', {
    args: ['--headless', '--disable-gpu', '--window-size=1024,768'],
    w3c: false,
});

const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return;
};

const fetchWithTimebound = async (
    urls: string[],
    filenames: string[],
    timebound: number,
    directory: string
) => {
    const loadingBar = loading('Downloading...').start();
    for (let i = 0; i < urls.length; i++) {
        loadingBar.text = `Downloading ${i + 1}/${urls.length}`;
        const url = urls[i];
        const filename = filenames[i];
        // ESOCKETTIMEDOUTが出るのであえてworkerを増やさず同期処理する。
        request({ method: 'GET', url, encoding: null }, (err, res, body) => {
            if (!err && res.statusCode === 200) {
                fs.writeFileSync(
                    path.join(directory, filename),
                    body,
                    'binary'
                );
            }
        });
        await sleep(timebound);
    }
    loadingBar.stop();
};

const generateFilenames = (urls: string[]) => {
    const filenames: string[] = [];
    let i = 0;
    urls.forEach((url) => {
        i++;
        filenames.push(url.split('/').pop() || `image${i}.file`);
    });
    return filenames;
};

const helloSelenium = async () => {
    let driver = await new Builder().forBrowser('chrome').build();
    await driver.get(
        'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC51%E8%A9%B1%E3%80%91%E3%82%AB%E3%83%A9%E3%83%80%E3%81%AB%E3%82%A4%E3%82%A4%E7%94%B7-raw/'
    );
    const title = await driver.getTitle();
    console.log(title);
    const dom = await driver.findElements(By.className('card-wrap'));
    const footer = await driver.findElement(By.id('footer-menu'));
    let fileCount = 0;
    for (const element of dom) {
        const filename = fileCount.toString().padStart(3, '0') + '.png';
        await driver.executeScript(
            'arguments[0].scrollIntoView(true);',
            element
        );
        await sleep(500);
        //element is div
        const img = await element.findElement(By.css('img'));
        //get image file
        const encoded = await img.takeScreenshot();
        const decoded = Buffer.from(encoded, 'base64');
        fs.writeFileSync(path.join('test', filename), decoded);
        const status = await img.getAttribute('data-ll-status');
        if (status === 'loaded') {
            console.log('loaded');
        } else {
            console.log('not loaded');
        }
    }
    console.log('domLenght = ' + dom.length);
    console.log(dom);
};

export { fetchWithTimebound, generateFilenames, sleep, helloSelenium };
