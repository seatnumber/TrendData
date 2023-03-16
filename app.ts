import Koa from 'koa';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import { config } from './config/config';
import { router } from './router/router';
import * as mongoconnect from './middleware/connectMongo';

const app = new Koa();
const accountListHTML = fs.readFileSync(path.join(__dirname, 'public', 'account_list.html'), 'utf8');

async function startUp() {
  global.mongodb = await mongoconnect.connect(config.mongohost, config.database);

  // Serve static files
  app.use(serve('public'));

  // Default route
  router.get('/', async (ctx: any) => {
    ctx.type = 'text/html';
    ctx.body = accountListHTML.replace('SERVER_IP', process.env.SERVER_IP || '35.74.231.172');
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(8081);
}

startUp();
