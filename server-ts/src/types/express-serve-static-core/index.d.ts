// types/express-serve-static-core/index.d.ts
import { ServerStatusManager } from '../../ServerStatusManager';
import { BCHelper } from '../../BCHelper';
declare module 'express-serve-static-core' {
  export interface Request {
    ssm: ServerStatusManager;
    bchelper: BCHelper;
    outdir: string;
  }
}
