import { createRequire } from 'module';
import pino from 'pino';
import { env } from './env.js';

const require = createRequire(import.meta.url);

function getTransport() {
  if (env.NODE_ENV !== 'development') {
    return undefined;
  }
  try {
    require.resolve('pino-pretty');
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    };
  } catch {
    return undefined;
  }
}

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
    ],
    remove: true,
  },
  transport: getTransport(),
});
