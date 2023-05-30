/**
 * helper for badcompany client
 */

import ServerStatusManager from "./ServerStatusManager";
import { Server } from "socket.io";

//work
/* type DW = {
  badcompany
} */

/* 
  public async addFetchJob(url: string, ifPush: boolean) {
  //
}
} */

export class BCHelper {
  private queue: any[] = [];
  private isProcessing: boolean = false;

  constructor(private ssm: ServerStatusManager, private outDir: string, private io: Server) {
    this.startProcessingLoop();
  }


  public addTask (task: any) {
    this.queue.push(task);
    this.processQueue();
  }

  private startProcessingLoop () {
    setInterval(() => {
      this.processQueue();
    }, 5 * 60 * 1000);
  }
  /**
   * タスクを処理。処理中のタスクがあれば何もしない。
   * @returns 
   */
  private async processQueue () {
    console.log('Checking BCHelper Queue...');
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    try {
      this.isProcessing = true;
      const task = this.queue.shift();
      await this.processTask(task);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * 実際にタスクを処理する関数。
   * @param task task
   */
  private async processTask (task: any) {
    // 長時間かかる処理を実装します
    // ここでは、例として2秒間待つだけの処理を行います
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Task processed: ${ task }`);
  }
}

