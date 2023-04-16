"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const toml_1 = __importDefault(require("toml"));
const fs_1 = __importDefault(require("fs"));
const utils = __importStar(require("./scrapeUtils"));
const Discord_1 = __importDefault(require("./Discord"));
const config = toml_1.default.parse(fs_1.default.readFileSync('./config.toml', 'utf-8'));
/* const app: Application = express();
const PORT = 3000;

interface CorsFunc {
    (req: Request, res: Response, next: Function): void;
}

const allowCrossDomain: CorsFunc = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, access_token'
    )
    if ('OPTIONS' === req.method) {
        res.send(200);
    } else {
        next();
    }
}


app.use(allowCrossDomain);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (_req: Request, res: Response) => {
    res.send('Manga Eater Server is Ready.');
})

app.post('/', async (req: Request, res: Response) => {
    const { urls, title } = req.body;
    const directory = `./out/${title}`;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
    const timebound = 500;
    const filenames = utils.generateFilenames(urls);
    await utils.fetchWithTimebound(urls,filenames,timebound,directory);
    
});

try {
    app.listen(PORT, () => {
        console.log(`Manga Eater Server Started in : http://localhost:${PORT}/`);
    })
} catch (e) {
    if (e instanceof Error) {
        console.error(e.message)
    }
}
 */
const discord = new Discord_1.default(config);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield discord.login();
    utils.sleep(1000);
    yield discord.sendText('Manga Eater Server is Ready.');
}))();
