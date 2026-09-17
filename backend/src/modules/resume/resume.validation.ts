import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../utils/errors.js';
import {
  SUPPORTED_RESUME_EXTENSIONS,
  SUPPORTED_RESUME_MIME_TYPES,
} from './resume.constants.js';

export interface ValidatedResumeFile {
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
}

function normalizeExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Validates uploaded resume files before storage or extraction.
 * Rejects unsupported types, oversize files, and unsafe filenames.
 */
export function validateResumeUpload(
  file: Express.Multer.File | undefined,
  maxFileSizeBytes: number,
): ValidatedResumeFile {
  if (!file) {
    throw new AppError('Resume file is required', 400, 'VALIDATION_ERROR');
  }

  if (file.size <= 0) {
    throw new AppError('Resume file is empty', 400, 'VALIDATION_ERROR');
  }

  if (file.size > maxFileSizeBytes) {
    throw new AppError('Resume file exceeds the maximum allowed size', 413, 'VALIDATION_ERROR');
  }

  const extension = normalizeExtension(file.originalname);
  if (!SUPPORTED_RESUME_EXTENSIONS.includes(extension as (typeof SUPPORTED_RESUME_EXTENSIONS)[number])) {
    throw new AppError(
      'Unsupported resume file type. Upload a PDF or plain text resume.',
      400,
      'VALIDATION_ERROR',
    );
  }

  const mimeType = file.mimetype.toLowerCase();
  if (!SUPPORTED_RESUME_MIME_TYPES.includes(mimeType as (typeof SUPPORTED_RESUME_MIME_TYPES)[number])) {
    throw new AppError(
      'Unsupported resume MIME type. Upload a PDF or plain text resume.',
      400,
      'VALIDATION_ERROR',
    );
  }

  const safeFilename = `${randomUUID()}${extension}`;

  return {
    originalFilename: path.basename(file.originalname),
    safeFilename,
    mimeType,
    fileSize: file.size,
    buffer: file.buffer,
  };
}

export function buildResumeStoragePath(userId: string, resumeId: string, safeFilename: string): string {
  return `${userId}/${resumeId}/${safeFilename}`;
}
