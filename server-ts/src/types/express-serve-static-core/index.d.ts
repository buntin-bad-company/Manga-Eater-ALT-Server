// types/express-serve-static-core/index.d.ts
import { ServerStatusManager } from '../../src/ServerStatusManager';
declare module 'express-serve-static-core' {
  export interface Request {
    ssm: ServerStatusManager;
    outdir: string;
  }
}