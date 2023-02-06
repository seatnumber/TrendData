import { start } from "repl";

const Koa = require('koa');
const app = new Koa();
import { router } from './router/router'
import { config } from './config/config'

const mongoconnect = require('./middleware/connectMongo.js')


async function startUp() {
  global.mongodb = await mongoconnect.connect(config.mongohost, config.database)
  // response
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(8081);
}

startUp()