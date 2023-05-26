import express from 'express';

const BadCompanyRouter = express.Router();

BadCompanyRouter.use((req, res, next) => {
  let d = new Date();
  let date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
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

export default BadCompanyRouter;
