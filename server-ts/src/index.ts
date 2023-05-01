import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import * as utils from './scrapeUtils';
import type { Config, DirectoryOutbound, Checked } from './scrapeUtils';
import Discord from './Discord';

console.log('Manga Eater Server is Starting...\nThis is a index.ts');

const app: Application = express();
const PORT = 11150;

interface CorsFunc {
    (req: Request, res: Response, next: Function): void;
}

const outDir = '/filerun/user-files/out';

const allowCrossDomain: CorsFunc = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, access_token'
    );
    if ('OPTIONS' === req.method) {
        res.send(200);
    } else {
        next();
    }
};

app.use(allowCrossDomain);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// "/" => "index.html"
app.use(express.static('./page/build'));
/* Main Process */
app.post('/', async (req: Request, res: Response) => {
    const config = utils.loadConf<Config>();
    const { urls, title, ifPush } = req.body;
    const titleAndEpisode: string = title;
    const titleAndEpisodeArr = titleAndEpisode.split('-');
    const titleName = titleAndEpisodeArr[0];
    const episode = titleAndEpisodeArr[1];
    const titleDirecotry = `${outDir}/${titleName}`;
    if (!fs.existsSync(titleDirecotry)) {
        fs.mkdirSync(titleDirecotry);
    }
    const directory = `${titleDirecotry}/${episode}`;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
    const timebound = 100;
    const filenames = utils.generateOrderFilenames(urls);
    await utils.downloadImages(urls, filenames, timebound, directory);
    console.log(ifPush);
    if (ifPush) {
        const discord = new Discord(config);
        await discord.login();
        await discord.sendFiles(directory, title, 500);
        discord.killClient();
    } else {
        console.log('No Push');
    }
    res.send('Download Complete');
});
app.post('/channel', async (req: Request, res: Response) => {
    console.log('req.body :', req.body);
    const { index } = req.body;
    utils.changeChannel(index);
    utils.fetchChannels().then((config) => {
        res.send(config.channelNames || { current: 'none' });
    });
});
app.get('/channel', (req: Request, res: Response) => {
    utils.fetchChannels().then((config) => {
        res.send(config.channelNames || { current: 'none' });
    });
});
app.get('/directory', (req: Request, res: Response) => {
    const directory = '/filerun/user-files/out';
    let out: DirectoryOutbound = { titles: [], outbound: [] };
    const titles = fs.readdirSync(directory);
    titles.forEach((title) => {
        out.titles.push(title);
        let episodes: string[] = [];
        const episodePaths = fs.readdirSync(`${directory}/${title}`); //[1,2,3,4...]みたいな
        episodePaths.forEach((episode) => {
            const count = fs.readdirSync(
                `${directory}/${title}/${episode}`
            ).length; //"./out/title/${episode}/*"の個数
            episodes.push(`${episode}-${count}`);
        });
        out.outbound.push({
            title,
            episodes,
        });
    });
    res.send(out);
});
app.post('/directory', async (req: Request, res: Response) => {
    const config = utils.loadConf<Config>();
    const checked: Checked[] = req.body;
    const discord = new Discord(config);
    await discord.login();
    await utils.sleep(3000);
    for (const check of checked) {
        const dir = outDir;
        const title = fs.readdirSync(dir)[check.index];
        const epDir = `${dir}/${title}`;
        const episodes = fs.readdirSync(epDir);
        const episodeIndex = check.checked;
        const threadName = `${title}第${episodes[episodeIndex[0]]}-${
            episodes[episodeIndex[episodeIndex.length - 1]]
        }話`;
        await discord.sendText(threadName);
        await discord.sendMultipleEpisodes(
            epDir,
            check.checked,
            500,
            threadName
        );
    }
    discord.killClient();
    res.send('ok');
});

try {
    app.listen(PORT, () => {
        console.log(
            `Manga Eater Server Started in : http://localhost:${PORT}/`
        );
    });
} catch (e) {
    if (e instanceof Error) {
        console.error(e.message);
    }
}
