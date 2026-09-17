import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    logger.info(
      {
        requestId: res.locals.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      'HTTP request completed',
    );
  });

  next();
}

export function correlationLogger(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.locals.logger = logger.child({ requestId: res.locals.requestId });
  next();
}
