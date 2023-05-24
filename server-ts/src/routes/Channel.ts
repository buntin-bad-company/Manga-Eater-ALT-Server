import express from 'express';
import * as utils from './utils';

const ChannelRouter = express.Router();

ChannelRouter.post('/', async (req, res) => {
  const ssm = req.ssm;
  console.log('req.body :', req.body);
  const { index } = req.body;
  utils.changeChannel(index);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
  ssm.setMsg('Operation is completed without problems.(Channel Changed)');
});

ChannelRouter.post('/add', async (req, res) => {
  const ssm = req.ssm;
  console.log('add channel');
  const { channelID } = req.body;
  const config = utils.loadConf<Config>();
  //check duplicate
  if (
    config.channel.alt.includes(channelID) ||
    config.channel.current === channelID
  ) {
    ssm.setMsg('Duplicate Channel ID Submitted. Ignore it.');
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  if (await utils.checkChannel(channelID)) {
    ssm.setMsg('Channel ID is valid. Added.');
  } else {
    ssm.setMsg('Channel ID is invalid. Ignore it.');
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  const newConfig = { ...config };
  newConfig.channel.alt.push(channelID);
  utils.writeConf(newConfig);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});

ChannelRouter.get('/', (req, res) => {
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});

export default ChannelRouter;

/* 
//チャンネル変更
app.post('/channel', async (req: Request, res: Response) => {
  console.log('req.body :', req.body);
  const { index } = req.body;
  utils.changeChannel(index);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
  ssm.setMsg('Operation is completed without problems.(Channel Changed)');
});

//チャンネル追加
app.post('/channel/add', async (req: Request, res: Response) => {
  console.log('add channel');
  const { channelID } = req.body;
  const config = utils.loadConf<Config>();
  //check deplicate
  if (
    config.channel.alt.includes(channelID) ||
    config.channel.current === channelID
  ) {
    ssm.setMsg('Deplicate Channel ID Submitted. Ignore it.');
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  if (await utils.checkChannel(channelID)) {
    ssm.setMsg('Channel ID is valid. Added.');
  } else {
    ssm.setMsg('Channel ID is invalid. Ignore it.');
    utils.fetchChannels().then((config) => {
      res.send(config.channelNames || { current: 'none' });
    });
    return;
  }
  const newConfig = { ...config };
  newConfig.channel.alt.push(channelID);
  utils.writeConf(newConfig);
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});
//チャンネル取得
app.get('/channel', (req: Request, res: Response) => {
  utils.fetchChannels().then((config) => {
    res.send(config.channelNames || { current: 'none' });
  });
});
*/