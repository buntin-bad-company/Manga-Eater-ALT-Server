import express, { Application, Request, Response } from 'express';
import toml from 'toml';
import fs from 'fs';
import * as utils from './scrapeUtils';
import Discord from './Discord';
import request from 'request';

//listen to port 3000
//print request body mock server
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
    const body = JSON.stringify(req.body, null, 4);
    console.log(body);
    res.send('Server accept the request.');
});

app.get('/channel', (req: Request, res: Response) => {
    res.send('Test Channel');
});

try {
    app.listen(PORT, () => {
        console.log(`server start at : http://localhost:${PORT}`);
    });
} catch (e) {
    if (e instanceof Error) {
        console.error(e.message);
    }
}
