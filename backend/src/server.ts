import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

app.listen(env.BACKEND_PORT, () => {
  logger.info({ port: env.BACKEND_PORT }, 'UpSkilr API server started');
});
