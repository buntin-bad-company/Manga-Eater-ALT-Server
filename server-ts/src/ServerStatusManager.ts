import { Server } from 'socket.io';

interface Job {
  id: string;
  title?: string;
  progress?: number; // 0-100
}

export interface ServerStatus {
  state: 'idle' | 'busy' | 'error';
  message: string;
  jobs: Job[];
}

class ServerStatusManager {
  private status: ServerStatus = {
    state: 'idle',
    message: 'Hello, World',
    jobs: [],
  };

  constructor(private io: Server) {}

  private setState() {
    if (this.status.jobs?.length === 0) {
      this.status.state = 'idle';
    } else {
      this.status.state = 'busy';
    }
  }

  public sendStatus(payload: ServerStatus) {
    this.status.message = payload.message;
    this.status.state = payload.state;
    this.status.jobs = payload.jobs;
    this.io.emit('status', this.status);
  }

  public appendJobs(job: Job) {
    if (!this.status.jobs) this.status.jobs = [];
    this.status.jobs.push(job);
    this.setState();
    this.io.emit('status', this.status);
  }

  public removeJobs(id: string) {
    if (!this.status.jobs) {
      throw new Error('Jobs is not defined.ジョブ関連どこかえらってる');
    }
    this.status.jobs = this.status.jobs.filter((job) => job.id !== id);
    this.setState();
    this.io.emit('status', this.status);
  }

  public setJobsTitle(id: string, title: string) {
    const job = this.status.jobs.find((job) => job.id === id);
    if (job) {
      job.title = title;
    }
    this.io.emit('status', this.status);
  }

  public setJobsProgress(id: string, progress: number) {
    const job = this.status.jobs.find((job) => job.id === id);
    if (job) {
      job.progress = progress;
    }
    this.setState();
    this.io.emit('status', this.status);
  }
}

export default ServerStatusManager;
