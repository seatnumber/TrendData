import Koa from 'koa';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import { config } from './config/config';
import { router } from './router/router';
import * as mongoconnect from './middleware/connectMongo';

const app = new Koa();
const accountListHTML = fs.readFileSync(path.join(__dirname, 'public', 'account_list.html'), 'utf8');
const accountDetailHTML = fs.readFileSync(path.join(__dirname, 'public', 'account_detail.html'), 'utf8');
const profitChartHTML = fs.readFileSync(path.join(__dirname, 'public', 'profit_chart.html'), 'utf8');


async function startUp() {
  global.mongodb = await mongoconnect.connect(config.mongohost, config.database);

  // Serve static files
  app.use(serve('public'));

  // Default route
  router.get('/', async (ctx: any) => {
    ctx.type = 'text/html';
    ctx.body = accountListHTML.replace('SERVER_IP', process.env.SERVER_IP || '127.0.0.1');
  });
  router.get('/account_detail', async (ctx: any) => {
    ctx.type = 'text/html';
    ctx.body = accountDetailHTML.replaceAll('SERVER_IP', process.env.SERVER_IP || '127.0.0.1');
  });
  router.get('/profit_chart',async (ctx: any) => {
    ctx.type = 'text/html';
    ctx.body = profitChartHTML.replaceAll('SERVER_IP', process.env.SERVER_IP || '127.0.0.1');
  })

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(8081);
}

startUp();
