/**
 * helper for badcompany client
 * black box architecture
 */

import ServerStatusManager from "./ServerStatusManager";
import {Server} from "socket.io";
import {generateRandomString, getTitleAndEpisodes, scrapeFromUrl, loadConf, Discord, log, writeRecord} from './complexUtils';


type BCTask = {
  type: string;
  url?: string;
  id: string;
  channelId?: string;
}

const bc = '[BCHelper]'

export class BCHelper {
  public static version: string = '1.0.1';
  private queue: BCTask[] = [];
  private isProcessing: boolean = false;

  constructor(private ssm: ServerStatusManager, private outDir: string, private io: Server) {
    this.startProcessingLoop();
  }

  public addTask(url: string, channelId: string, type: string) {
    const task: BCTask = {
      type,
      url,
      id: generateRandomString(10),
      channelId,
    }
    log(`Adding Task: ${task.id}`);
    console.log(`task: ${JSON.stringify(task, null, 4)}`)
    this.queue.push(task);
    if (!this.isProcessing) {
      this.processQueue();
    }
    return task.id;
  }

  public get state() {
    return {
      version: BCHelper.version,
      queue: this.queue,
      isProcessing: this.isProcessing,
    }
  }

  private startProcessingLoop() {
    setInterval(() => {
      this.processQueue();
    }, 1 * 60 * 1000);
  }

  /**
   * タスクを処理。処理中のタスクがあれば何もしない。
   * @returns 
   */
  private async processQueue() {
    console.log('Checking BCHelper Queue...');
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    try {
      this.isProcessing = true;
      const task = this.queue.shift();
      await this.helper(task);
    } finally {
      this.isProcessing = false;
    }
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * 実際にタスクを処理する関数。
   * @param task task
   */
  private async helper(task: BCTask | undefined) {
    if (!task) {
      return;
    }
    //'deferred-fetch-push' : 'deferred-fetch'
    const {type, channelId, url} = task;
    if (!type || !channelId || !url) {
      log(`bch:[ERROR]-[helper] task is invalid. task: \n\`\`\`json${JSON.stringify(task, null, 4)}\`\`\``);
      return;
    }
    const ifPush = type.includes('push');
    const ifFetch = type.includes('fetch');
    if (ifFetch) {
      let processId = this.ssm.createFetchJob();
      try {
        const titles = await getTitleAndEpisodes(url);
        this.ssm.setJobsTitle(processId, `${titles.title}: ${titles.episode}話(BC)`);
        this.ssm.setJobsProgress(processId, 'Downloading...');
        const {directory: dir, threadName: title} = await scrapeFromUrl(
          url,
          this.outDir
        );
        if (ifPush) {
          const config = loadConf<Config>();
          const discord = new Discord(config);
          await discord.login();
          processId = this.ssm.switchJob(processId);
          this.ssm.setJobsTitle(processId, title);
          this.ssm.setJobsProgress(processId, 'Pushing... (Preparing)');
          await discord.sendFilesWithSSMInChannelId(dir, title, 500, this.ssm, processId, channelId);
        }
      } finally {
        this.ssm.removeJob(processId);
        writeRecord(bc + type, task);
        return;
      }
    }
    if (ifPush) {
      //iffetch=false,
      return;
    }
  }
}

