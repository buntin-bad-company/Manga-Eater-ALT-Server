// types/express-serve-static-core/index.d.ts
import {ServerStatusManager} from '../../ServerStatusManager';
declare module 'express-serve-static-core' {
  export interface Request {
    ssm: ServerStatusManager;
    outdir: string;
  }
}
