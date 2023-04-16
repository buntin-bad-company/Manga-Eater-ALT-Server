import request from 'request';
import path from 'path';
import fs from 'fs';
import loading from 'loading-cli';

const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return;
}


const fetchWithTimebound = async (urls: string[], filenames: string[], timebound: number, directory: string) => {
    const loadingBar = loading('Downloading...').start();
    for (let i = 0; i < urls.length; i++) {
        loadingBar.text = `Downloading ${i + 1}/${urls.length}`;
        const url = urls[i];
        const filename = filenames[i];
        // ESOCKETTIMEDOUTが出るのであえてworkerを増やさず同期処理する。
        request(
            { method: 'GET', url, encoding: null },
            (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    fs.writeFileSync(path.join(directory, filename), body, 'binary');
                }
            }
        )
        await sleep(timebound);
    }
    loadingBar.stop();
}

const generateFilenames = (urls: string[]) => {
    const filenames: string[] = [];
    let i = 0;
    urls.forEach((url) => {
        i++;
        filenames.push(url.split('/').pop() || `image${i}.file`);
    });
    return filenames;
}




export { fetchWithTimebound, generateFilenames,sleep };