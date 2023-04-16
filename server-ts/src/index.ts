import express, { Application, Request, Response } from 'express';

import toml from 'toml';
import request from 'request';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import * as utils from './scrapeUtils';
import loading from 'loading-cli';
import Discord from './Discord';

export interface Config {
    token: string;
    channelID: string;
}
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8')) as Config;

const app: Application = express();
const PORT = 3000;

interface CorsFunc {
    (req: Request, res: Response, next: Function): void;
}

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

app.get('/', async (_req: Request, res: Response) => {
    res.send('Manga Eater Server is Ready.');
});

/* Main Process */
app.post('/', async (req: Request, res: Response) => {
    const { urls, title } = req.body;
    const discord = new Discord(config);
    discord.login();
    const directory = `./out/${title}`;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
    const timebound = 500;
    const filenames = utils.generateFilenames(urls);
    await utils.fetchWithTimebound(urls, filenames, timebound, directory);
    await discord.sendFiles(directory, title, 500);
    discord.killClient();
    res.send('Download Complete');
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
