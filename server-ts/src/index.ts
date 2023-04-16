import express, { Application, Request, Response } from 'express';
import toml from 'toml';
import fs from 'fs';
import * as utils from './scrapeUtils';
import Discord from './Discord';
import request from 'request';

// load config.json
const loadConfig = () => {
    const config = JSON.parse(
        fs.readFileSync('./config.json', 'utf8')
    ) as Config;
    return config;
};

// write config.json from a Config object
const writeConfig = (config: Config) => {
    // write config.json
    fs.writeFileSync('./config.json', JSON.stringify(config));
};

export interface Config {
    token: string;
    channelID: string;
}

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
    const config = loadConfig();
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

app.post('/channel', async (req: Request, res: Response) => {
    console.log('req.body :', req.body);
    /*  const config = loadConfig();
    const { channelID } = req.body;
    config.channelID = channelID;
    writeConfig(config) */ res.send('Channel ID Updated');
});
app.get('/channel', async (_req: Request, res: Response) => {
    const config = loadConfig();
    // get channel name from discord api with channelID and api key
    const channelName = await new Promise((resolve, reject) => {
        request(
            `https://discord.com/api/channels/${config.channelID}`,
            {
                headers: {
                    Authorization: `Bot ${config.token}`,
                },
            },
            (err, _res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(body).name);
                }
            }
        );
    });
    res.send(channelName);
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
