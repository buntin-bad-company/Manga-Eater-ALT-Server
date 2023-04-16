"use strict";
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
exports.sleep = exports.generateFilenames = exports.fetchWithTimebound = void 0;
const request_1 = __importDefault(require("request"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const loading_cli_1 = __importDefault(require("loading-cli"));
const sleep = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve) => setTimeout(resolve, ms));
    return;
});
exports.sleep = sleep;
const fetchWithTimebound = (urls, filenames, timebound, directory) => __awaiter(void 0, void 0, void 0, function* () {
    const loadingBar = (0, loading_cli_1.default)('Downloading...').start();
    for (let i = 0; i < urls.length; i++) {
        loadingBar.text = `Downloading ${i + 1}/${urls.length}`;
        const url = urls[i];
        const filename = filenames[i];
        // ESOCKETTIMEDOUTが出るのであえてworkerを増やさず同期処理する。
        (0, request_1.default)({ method: 'GET', url, encoding: null }, (err, res, body) => {
            if (!err && res.statusCode === 200) {
                fs_1.default.writeFileSync(path_1.default.join(directory, filename), body, 'binary');
            }
        });
        yield sleep(timebound);
    }
    loadingBar.stop();
});
exports.fetchWithTimebound = fetchWithTimebound;
const generateFilenames = (urls) => {
    const filenames = [];
    let i = 0;
    urls.forEach((url) => {
        i++;
        filenames.push(url.split('/').pop() || `image${i}.file`);
    });
    return filenames;
};
exports.generateFilenames = generateFilenames;
