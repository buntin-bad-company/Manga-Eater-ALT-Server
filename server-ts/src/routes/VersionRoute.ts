import express from 'express';
import { execSync } from 'child_process';

import { loadConf } from './utils';

const VersionRouter = express.Router();
const getVersion = () => {
  return ( loadConf() as Config ).version;
}

const getGitHash = () => {
  try {
    return execSync( 'git rev-parse HEAD' ).toString().trim().slice( 0, 7 );
  } catch ( e ) {
    return 'unknown';
  }
}

const getGitComment = () => {
  try {
    return execSync( 'git log -1 --pretty=%B' ).toString().trim();
  } catch ( error ) {
    console.error( 'Could not get git commit message', error );
    return 'unknown';
  }
}

VersionRouter.get( '/', ( req, res ) => {
  res.send( getVersion() );
} );

VersionRouter.get( '/info/', ( req, res ) => {
  const ssm = req.ssm;
  const version: VersionInfo = {
    version: getVersion(),
    build_id: getGitHash(),
    build_message: getGitComment(),
    number_of_jobs: ssm.getStatus.jobs.length,
  }
  res.send( version );
} );

export default VersionRouter;
