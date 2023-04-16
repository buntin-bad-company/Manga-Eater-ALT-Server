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
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const loading_cli_1 = __importDefault(require("loading-cli"));
const path_1 = __importDefault(require("path"));
const scrapeUtils_1 = require("./scrapeUtils");
class Discord {
    constructor(config) {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildMembers,
            ],
        });
        this.token = '';
        this.channelID = '';
        this.token = config.token;
        this.channelID = config.channelID;
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.login(this.token);
            return;
        });
    }
    get channel() {
        console.log(this.client.channels.cache);
        console.log(this.channelID);
        console.log(this.token);
        const channel = this.client.channels.cache.get(this.channelID);
        if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
            throw new Error('Channel not found.');
        }
        return channel;
    }
    thread(title) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = this.channel;
            const thread = yield channel.threads.create({
                name: title,
                autoArchiveDuration: 1440,
            });
            return thread;
        });
    }
    del() {
        this.client.destroy();
    }
    sendFiles(directory, title, timebound) {
        return __awaiter(this, void 0, void 0, function* () {
            const load = (0, loading_cli_1.default)('Sending...').start();
            const files = fs_1.default.readdirSync(directory);
            load.text = 'Splitting files...';
            let sections = [];
            let section = [];
            let nowSize = 0;
            for (let i = 0; i < files.length; i++) {
                const current = path_1.default.join('direcotry', files[i]);
                if (nowSize + fs_1.default.statSync(current).size > 7000000 || section.length == 10) {
                    sections.push(section);
                    nowSize = 0;
                    section = [];
                }
                section.push(current);
                nowSize += fs_1.default.statSync(current).size;
                if (i == files.length - 1) {
                    sections.push(section);
                }
            }
            load.text = 'Sending...';
            const thread = yield this.thread(title);
            for (let i = 0; i < sections.length; i++) {
                load.text = `Sending ${i + 1}/${sections.length}`;
                yield thread.send({ files: sections[i] });
                (0, scrapeUtils_1.sleep)(timebound);
            }
            load.succeed('send success.');
        });
    }
    sendText(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = this.channel;
            yield channel.send(text);
        });
    }
}
exports.default = Discord;
