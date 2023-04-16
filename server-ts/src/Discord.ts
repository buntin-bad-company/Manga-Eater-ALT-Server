import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import fs from 'fs';
import loading from 'loading-cli';
import path from 'path';
import { sleep } from './scrapeUtils';
import { Config } from './index';

class Discord {
    private client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
        ],
    });
    private token = '';
    private channelID = '';
    constructor(config: Config) {
        this.token = config.token;
        this.channelID = config.channelID;
    }
    public async login() {
        this.client.on('ready', () => {
            console.log('Logged in as ' + this.client.user?.tag);
        });
        await this.client.login(this.token);
    }

    public get channel() {
        // check if channel is logged in
        console.log(this.client.isReady());
        console.log(this.client.channels.cache);
        console.log(this.channelID);
        console.log(this.token);
        const channel = this.client.channels.cache.get(this.channelID);
        if (!channel ) {
            throw new Error('Channel not found.');
        } else if (!(channel instanceof TextChannel)) {
            throw new Error('Channel is not a text channel.');
        }
        return channel;
    }

    public async thread(title: string) {
        const channel = this.channel;
        const thread = await channel.threads.create({
            name: title,
            autoArchiveDuration: 1440,
        });
        return thread;
    }

    // reset a client
    public async reset() {
        await this.client.destroy();
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ],
        });
    }
    
    public async sendFiles(directory: string, title: string, timebound: number) {
        const load = loading('Sending...').start();
        const files = fs.readdirSync(directory);
        load.text = 'Splitting files...';
        let sections = [];
        let section: string[] = [];
        let nowSize = 0;
        for (let i = 0; i < files.length; i++) {
            const current = path.join('direcotry', files[i]);
            if (nowSize + fs.statSync(current).size > 7000000 || section.length == 10) {
                sections.push(section);
                nowSize = 0;
                section = [];
            }
            section.push(current);
            nowSize += fs.statSync(current).size;
            if (i == files.length - 1) {
                sections.push(section);
            }
        }
        load.text = 'Sending...';
        const thread = await this.thread(title);
        for (let i = 0; i < sections.length; i++) {
            load.text = `Sending ${i + 1}/${sections.length}`;
            await thread.send({ files: sections[i] });
            sleep(timebound);
        }
        load.succeed('send success.');
    }

    public async sendText(text: string) {
        const channel = this.channel;
        await channel.send(text);
    }
}

export default Discord;