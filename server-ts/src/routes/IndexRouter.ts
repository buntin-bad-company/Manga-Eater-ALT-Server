import express from 'express';
import path from 'path';
import * as utils from './utils';
const IndexRouter = express.Router();

IndexRouter.use(express.static('./page/build'));

/* Main Process */
IndexRouter.post('/', async (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  const config = utils.loadConf<Config>();
  const {urls, title, ifPush} = req.body;
  let processId = ssm.createFetchJob();
  ssm.setJobsTitle(processId, title);
  ssm.setJobsProgress(processId, 'Analyzing...');
  const titleAndEpisode: string = title;
  const titleAndEpisodeArr = titleAndEpisode.split('-');
  const titleName = titleAndEpisodeArr[ 0 ];
  const episode = titleAndEpisodeArr[ 1 ];
  const paddedEpisode = utils.padZero(episode);
  const directory = path.join(outDir, titleName, paddedEpisode);
  const timebound = 100;
  const filenames = utils.generateOrderFilenames(urls);
  await utils.downloadImagesWithSSM(
    urls,
    filenames,
    timebound,
    directory,
    ssm,
    processId
  );
  console.log(ifPush);
  if (ifPush) {
    processId = ssm.switchJob(processId);
    ssm.setJobsProgress(processId, 'Pushing... (Preparing)');
    const discord = new utils.Discord(config);
    await discord.login();
    await discord.sendFilesWithSSM(directory, title, 500, ssm, processId);
    discord.killClient();
  } else {
    console.log('No Push');
  }
  ssm.removeJob(processId);
  res.send('Download Complete');
});

export default IndexRouter;

/* 
app.use(express.static('./page/build'));

app.post('/', async (req: Request, res: Response) => {
  const config = utils.loadConf<Config>();
  const { urls, title, ifPush } = req.body;
  let processId = ssm.createFetchJob();
  ssm.setJobsTitle(processId, title);
  ssm.setJobsProgress(processId, 'Analyzing...');
  const titleAndEpisode: string = title;
  const titleAndEpisodeArr = titleAndEpisode.split('-');
  const titleName = titleAndEpisodeArr[0];
  const episode = titleAndEpisodeArr[1];
  const paddedEpisode = utils.padZero(episode);
  const directory = path.join(outDir, titleName, paddedEpisode);
  const timebound = 100;
  const filenames = utils.generateOrderFilenames(urls);
  await utils.downloadImagesWithSSM(
    urls,
    filenames,
    timebound,
    directory,
    ssm,
    processId
  );
  console.log(ifPush);
  if (ifPush) {
    processId = ssm.switchJob(processId);
    ssm.setJobsProgress(processId, 'Pushing... (Preparing)');
    const discord = new Discord(config);
    await discord.login();
    await discord.sendFilesWithSSM(directory, title, 500, ssm, processId);
    discord.killClient();
  } else {
    console.log('No Push');
  }
  ssm.removeJob(processId);
  res.send('Download Complete');
});
*/