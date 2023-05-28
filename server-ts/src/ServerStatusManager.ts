import {Server} from 'socket.io';
import crypto from 'crypto';
import {REST} from 'discord.js';
import {Routes} from 'discord-api-types/v10';
import fs from 'fs';

const discordLogger = async (message: string) => {
  const config: Config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  const token = config.token;
  const logChannel = config.logChannel;
  if (!logChannel) return console.log(message);
  const logText = `**${new Date().toLocaleString()}**   ${message}`;
  if (logChannel) {
    try {
      await new REST({version: '10'})
        .setToken(token)
        .post(Routes.channelMessages(logChannel), {
          body: {
            content: logText,
          },
        });
    } catch (e) {
      console.error(e);
    }
  }
};

interface Job {
  id: string;
  title?: string;
  progress?: string;
}

export interface ServerStatus {
  state: 'idle' | 'busy' | 'error';
  message: string;
  jobs: Job[];
}

class ServerStatusManager {
  private ids: Set<string> = new Set();
  private status: ServerStatus = {
    state: 'idle',
    message: 'Hello, World',
    jobs: [],
  };
  private genId(prefix: 'f' | 'p' | 'e') {
    let uniqueId = '';
    do {
      const hash = crypto.randomBytes(3).toString('hex'); // 3 bytes * 2 (hex) = 6 characters
      uniqueId = `${prefix}${hash}`;
    } while (this.ids.has(uniqueId));
    this.ids.add(uniqueId);
    return uniqueId;
  }
  private update() {
    this.io.emit('status', this.status);
  }

  get getStatus() {
    return this.status;
  }

  constructor(private io: Server) {}

  private setState() {
    if (this.status.jobs?.length === 0) {
      this.status.state = 'idle';
    } else {
      this.status.state = 'busy';
    }
  }

  public getJobCount() {
    return this.status.jobs?.length;
  }

  public setMsg(msg: string) {
    this.status.message = msg;
    this.update();
  }

  public sendStatus(payload: ServerStatus) {
    this.status.message = payload.message;
    this.status.state = payload.state;
    this.status.jobs = payload.jobs;
    this.update();
  }

  public createFetchJob() {
    if (!this.status.jobs) this.status.jobs = [];
    const id = this.genId('f');
    const initialJob: Job = {
      id,
      title: 'Loading...',
      progress: '0%',
    };
    this.status.jobs.push(initialJob);
    this.setState();
    this.update();
    discordLogger(`Fetch Job(ID: ${id}) -> submitted`);
    return id;
  }

  public createPushJob() {
    if (!this.status.jobs) this.status.jobs = [];
    const id = this.genId('p');
    const initialJob: Job = {
      id,
      title: 'Uploading...',
      progress: '0%',
    };
    this.status.jobs.push(initialJob);
    this.setState();
    this.io.emit('status', this.status);
    discordLogger(`Push Job(ID: ${id}) -> submitted`);
    return id;
  }

  public createEtcJob() {
    if (!this.status.jobs) this.status.jobs = [];
    const id = this.genId('e');
    const initialJob: Job = {
      id,
      title: 'Processing...',
      progress: '0%',
    };
    this.status.jobs.push(initialJob);
    this.setState();
    this.update();
    discordLogger(`Etc Job(ID: ${id}) -> submitted`);
    return id;
  }

  public removeJob(id: string) {
    this.status.jobs = this.status.jobs.filter((job) => job.id !== id);
    this.ids.delete(id);
    this.setState();
    this.update();
    discordLogger(`Job(ID: ${id}) -> fullfilled`);
  }

  public setJobsTitle(id: string, title: string) {
    const job = this.status.jobs.find((job) => job.id === id);
    if (job) {
      job.title = title;
    }
    this.io.emit('status', this.status);
  }

  public setJobsProgress(id: string, progress: string) {
    const job = this.status.jobs.find((job) => job.id === id);
    if (job) {
      job.progress = progress;
    }
    this.setState();
    this.io.emit('status', this.status);
  }

  public switchJob(id: string) {
    const job = this.status.jobs.find((job) => job.id === id);
    if (!job) throw new Error('Job not found');
    const currentID = job.id;
    job.id = currentID.startsWith('f') ? this.genId('p') : this.genId('f');
    this.ids.delete(currentID);
    this.ids.add(job.id);
    this.update();
    return job.id;
  }
}

export default ServerStatusManager;
