import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { healthService } from './health.service.js';

export const getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = await healthService.getStatus();
  const httpStatus = status.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(status);
});
