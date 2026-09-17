import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

export const resumeUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.RESUME_MAX_FILE_SIZE_BYTES,
    files: 1,
  },
}).single('file');

export function handleResumeUploadErrors(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('Resume file exceeds the maximum allowed size', 413, 'VALIDATION_ERROR'));
      return;
    }

    next(new AppError('Invalid resume upload', 400, 'VALIDATION_ERROR'));
    return;
  }

  next(err);
}

export function resumeUpload(req: Request, res: Response, next: NextFunction): void {
  resumeUploadMiddleware(req, res, (err) => {
    if (err) {
      handleResumeUploadErrors(err, req, res, next);
      return;
    }
    next();
  });
}
