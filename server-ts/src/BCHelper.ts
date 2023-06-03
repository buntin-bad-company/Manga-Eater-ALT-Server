/**
 * helper for badcompany client
 * black box architecture
 */

import ServerStatusManager from './ServerStatusManager';
import { Server } from 'socket.io';
import {
  sleep,
  singleTitleScrape,
  calcPer,
  scrapeTitlePage,
  generateRandomString,
  getTitleAndEpisodes,
  scrapeFromUrl,
  loadConf,
  Discord,
  log,
  writeRecord,
} from './complexUtils';

/**
 * BadCompanyのタスクを実際に処理するヘルパークラス
 * ブラックボックスのため、処理を追加するaddTask,
 */
export class BCHelper {
  public static version: string = '1.0.1';
  private queue: BCTask[] = [];
  private isProcessing: boolean = false;

  constructor(
    private ssm: ServerStatusManager,
    private outDir: string,
    private io: Server
  ) {
    this.startProcessingLoop();
  }

  public addTask(url: string, channelId: string, type: string) {
    const task: BCTask = {
      type,
      url,
      id: generateRandomString(10),
      channelId,
    };
    log(`Adding Task: ${task.id}`);
    console.log(`task: ${JSON.stringify(task, null, 4)}`);
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
    };
  }

  private startProcessingLoop() {
    setInterval(() => {
      this.processQueue();
    }, 5 * 60 * 1000);
  }

  /**
   * タスクを処理。処理中のタスクがあれば何もしない。
   * @returns
   */
  private async processQueue() {
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
    const { type, channelId, url } = task;
    if (!type || !channelId || !url) {
      log(
        `bch:[ERROR]-[helper] task is invalid. task: \n\`\`\`json${JSON.stringify(
          task,
          null,
          4
        )}\`\`\``
      );
      return;
    }
    let ifPush = type.includes('push');
    if (url.includes('mangarawjp.io')) {
      await this.mangarawjpio(url, task, channelId, type, ifPush);
    }
  }

  private async mangarawjpio(
    url: string,
    task: BCTask,
    channelId: string,
    type: string,
    ifPush: boolean
  ) {
    if (url.includes('chapter')) {
      singleTitleScrape(
        task,
        this.ssm,
        type,
        url,
        this.outDir,
        channelId,
        ifPush
      );
    } else {
      const { title, urls } = await scrapeTitlePage(url);
      const pid = this.ssm.createFetchJob();
      this.ssm.setJobsTitle(pid, title);
      this.ssm.setJobsProgress(pid, 'Fetching title page...');
      const len = urls.length;
      for (let i = 0; i < len; i++) {
        this.ssm.setJobsProgress(
          pid,
          `Fetching title page... ${calcPer(i + 1, len)}%`
        );
        try {
          await singleTitleScrape(
            task,
            this.ssm,
            type,
            urls[i],
            this.outDir,
            channelId,
            false
          );
        } catch (e) {
          e = e as Error;
          await log(
            '[BCH]' + ` [ERROR]-[helper] ${JSON.stringify(e, null, 4)}`
          );
        } finally {
          this.ssm.setJobsProgress(pid, 'wait 1 min...');
          await sleep(1000 * 60 * 1);
        }
      }
      this.ssm.removeJob(pid);
    }
  }
}
