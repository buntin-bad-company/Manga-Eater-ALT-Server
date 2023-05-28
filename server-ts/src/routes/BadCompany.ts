/**
 * @fileoverview BadCompany router
 * @file router for BadCompany Client on Cloudflare Workers
 */

import express from 'express';
import {respondInteraction} from './utils';
const BadCompanyRouter = express.Router();

BadCompanyRouter.use((req, res, next) => {
  let d = new Date();
  let date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}(${[ '日', '月', '火', '水', '木', '金', '土' ][ d.getDay() ]
    })${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`.replace(/\n|\r/g, '');
  console.log(`BadCompany router: ${date}`);
  next();
});

BadCompanyRouter.get('/', (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  res.send('BadCompany router');
});

BadCompanyRouter.get('/query', (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  res.send('BadCompany router query');
});

BadCompanyRouter.post('/', async (req, res) => {
  const ssm = req.ssm;
  const outDir = req.outdir;
  const body: BC_GeneralPayload = req.body;
  console.log(JSON.stringify(body, null, 4));
  respondInteraction(body.eventInfo.app_id, body.eventInfo.token, {content: 'hello'});
  res.send('BadCompany router post');
})

export default BadCompanyRouter;
