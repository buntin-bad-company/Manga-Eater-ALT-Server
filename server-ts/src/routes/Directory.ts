import express from 'express';
const DirectoryRouter = express.Router();
import fs from 'fs';
import * as utils from './utils';
import Discord from '../Discord';

// directory 構造
DirectoryRouter.get('/', (req, res) => {
  const directory = req.outdir;
  let out: DirectoryOutbound = { titles: [], outbound: [] };
  const titles = fs.readdirSync(directory);
  titles.forEach((title) => {
    const titleDir = `${directory}/${title}`;
    if (fs.readdirSync(titleDir).length === 0) {
      fs.rmdirSync(titleDir);
      return;
    }
    out.titles.push(title);
    let episodes: string[] = [];
    const episodePaths = fs.readdirSync(titleDir);
    episodePaths.forEach((episode) => {
      const count = fs.readdirSync(`${directory}/${title}/${episode}`).length;
      episodes.push(`${episode}-${count}`);
    });
    out.outbound.push({
      title,
      episodes,
    });
  });
  res.send(out);
});

//複数push
DirectoryRouter.post('/', async (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  const processId = ssm.createPushJob();
  const config = utils.loadConf<Config>();
  const checked: Checked[] = req.body;
  const discord = new Discord(config);
  await discord.login();
  await utils.sleep(3000);
  const len = checked.length;
  let count = 1;
  for (const check of checked) {
    const dir = outDir;
    const title = fs.readdirSync(dir)[check.index];
    const epDir = `${dir}/${title}`;
    ssm.setJobsTitle(processId, title);
    ssm.setJobsProgress(processId, `${utils.calcPer(count, len)}%`);
    const episodes = fs.readdirSync(epDir);
    const episodeIndex = check.checked;
    const threadName = `${title}第${utils.trimZero(
      episodes[episodeIndex[0]]
    )}-${utils.trimZero(episodes[episodeIndex[episodeIndex.length - 1]])}話`;
    await discord.sendText(threadName);
    await discord.sendMultipleEpisodes(epDir, check.checked, 500, threadName);
  }
  ssm.removeJob(processId);
  ssm.setMsg('Operation fullfilled (Push)');
  discord.killClient();
  res.send('ok');
});

DirectoryRouter.delete('/', async (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  const checked: Checked[] = req.body;
  const processId = ssm.createEtcJob();
  ssm.setJobsTitle(processId, 'Remove Directories');
  const dirs = utils.getDirList(checked, outDir);
  for (let c = 0; c < checked.length; c++) {
    ssm.setJobsProgress(processId, `${utils.calcPer(c + 1, checked.length)}%`);
    fs.rmSync(dirs[c], { recursive: true, force: true });
  }
  ssm.removeJob(processId);
  res.send('all done');
});

export default DirectoryRouter;




//複数削除
/* app.delete('/directory', async (req: Request, res: Response) => {
  const checked: Checked[] = req.body;
  let rmHistory = '';
  let c = 1;
  const processId = ssm.createEtcJob();
  ssm.setJobsTitle(processId, 'Remove Directories');
  const len = checked.length;
  for (const check of checked) {
    ssm.setJobsProgress(processId, `${utils.calcPer(c, len)}%`);
    const dir = outDir;
    const title = fs.readdirSync(dir)[check.index];
    rmHistory += `${title}(`;
    const epDir = `${dir}/${title}`;
    const episodes = fs.readdirSync(epDir);
    const episodeIndex = check.checked;
    for (const index of episodeIndex) {
      rmHistory += ` ${episodes[index]},`;
      const episode = episodes[index];
      const episodeDir = `${epDir}/${episode}`;
      const files = fs.readdirSync(episodeDir);
      for (const file of files) {
        fs.unlinkSync(`${episodeDir}/${file}`);
      }
      fs.rmdirSync(episodeDir);
    }
    rmHistory += '), ';
    c++;
  }
  ssm.removeJob(processId);
  res.send('all done');
}); */