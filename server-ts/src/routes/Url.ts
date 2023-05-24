import express from 'express';
import * as utils from './utils';
const UrlRouter = express.Router();
/**
 * チャプターURLから画像をDLし、ifPushがtrueならdiscordに送信する
 * @param url {string} mangarawjp.ioのチャプターurl
 * @param ifPush
 */
const dlHelperFromURL = async (
  url: string,
  ifPush: boolean,
  processId: string,
  outDir: string,
  ssm: utils.ServerStatusManager
) => {
  const { directory: dir, threadName: title } = await utils.scrapeFromUrl(
    url,
    outDir
  );
  if (ifPush) {
    const config = utils.loadConf<Config>();
    const discord = new utils.Discord(config);
    await discord.login();
    processId = ssm.switchJob(processId);
    ssm.setJobsTitle(processId, title);
    ssm.setJobsProgress(processId, 'Pushing... (Preparing)');
    await discord.sendFilesWithSSM(dir, title, 500, ssm, processId);
  }
  return dir;
};

UrlRouter.post('/', async (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  let processId = '';
  try {
    processId = ssm.createFetchJob();
    const { url, ifPush } = req.body;
    const urlString = url as string;
    if (urlString.includes('chapter')) {
      const titles = await utils.getTitleAndEpisodes(urlString);
      ssm.setJobsTitle(processId, `${titles.title}: ${titles.episode}話`);
      await dlHelperFromURL(url, ifPush, processId, outDir, ssm);
    } else {
      //URLがタイトルURLの場合
      ssm.setJobsTitle(processId, 'Multiple Chapters');
      ssm.setJobsProgress(processId, 'URLs Analyzing...');
      const { title, urls } = await utils.scrapeTitlePage(urlString);
      const len = urls.length;
      for (let i = 0; i < len; i++) {
        ssm.setJobsTitle(processId, title);
        try {
          ssm.setJobsProgress(processId, `${utils.calcPer(i + 1, len)}%`);
          await dlHelperFromURL(urls[i], false, processId, outDir, ssm);
        } catch (e) {
          console.error(e);
          ssm.removeJob(processId);
          res.send('Error Occured');
          return;
        }
        ssm.setJobsProgress(processId, 'Standing by for 1 minute...');
        await utils.sleep(1000 * 60 * 1);
      }
    }
    res.send('Download Complete');
  } catch (e) {
    console.error(e);
    ssm.setMsg('Server Error');
  } finally {
    ssm.removeJob(processId);
  }
});

export default UrlRouter;

/* app.post('/url', async (req: Request, res: Response) => {
  try {
    console.log('req.body :', req.body);
    const { url, ifPush } = req.body;
    const urlString = url as string;
    let processId = ssm.createFetchJob();
    if (urlString.includes('chapter')) {
      //URLがチャプターURLの場合
      await dlHelperFromURL(url, ifPush, processId);
    } else {
      //URLがタイトルURLの場合
      ssm.setJobsTitle(processId, 'Multiple Chapters');
      ssm.setJobsProgress(processId, 'URLs Analyzing...');
      const { title, urls } = await utils.scrapeTitlePage(urlString);
      const len = urls.length;
      for (let i = 0; i < len; i++) {
        ssm.setJobsTitle(processId, title);
        try {
          ssm.setJobsProgress(processId, `${utils.calcPer(i + 1, len)}%`);
          await dlHelperFromURL(urls[i], false, processId);
        } catch (e) {
          console.error(e);
          ssm.removeJob(processId);
          res.send('Error Occured');
          return;
        }
        ssm.setJobsProgress(processId, 'Standing by for 1 minute...');
        await utils.sleep(1000 * 60 * 1);
      }
    }
    ssm.removeJob(processId);
    res.send('Download Complete');
  } catch (e) {
    console.error(e);
    ssm.setMsg('Server Error');
  }
}); */