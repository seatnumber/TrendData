import { start } from "repl";

const Koa = require('koa');
const serve = require('koa-static');
const app = new Koa();
const fs = require('fs');
const path = require('path');

const accountListHTML = fs.readFileSync(path.join(__dirname, 'public', 'account_list.html'), 'utf8');

import { router } from './router/router'
import { config } from './config/config'

const mongoconnect = require('./middleware/connectMongo.js')


async function startUp() {
  global.mongodb = await mongoconnect.connect(config.mongohost, config.database)
  // response
  // Serve static files
  app.use(serve('public'));

  // Default route
  router.get('/', async (ctx: any) => {
    ctx.type = 'text/html';
    console.log('IP: ',process.env.SERVER_IP)
    ctx.body = accountListHTML.replace('SERVER_IP', process.env.SERVER_IP || '35.74.231.172');
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(8081);
}

startUp()