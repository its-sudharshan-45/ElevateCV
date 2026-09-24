import { z } from 'zod';
import { RESUME_VERSION_SOURCES } from './resume-version.types.js';

export const createResumeVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be ≤ 200 characters').trim(),
  changesSummary: z.string().max(2000, 'Summary must be ≤ 2000 characters').trim().optional().default(''),
  source: z.enum(RESUME_VERSION_SOURCES).optional().default('MANUAL_EDIT'),
  structuredData: z.any().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
});

export const compareVersionsQuerySchema = z.object({
  versionA: z.string().uuid('versionA must be a valid UUID'),
  versionB: z.string().uuid('versionB must be a valid UUID'),
});

export type CreateResumeVersionBody = z.infer<typeof createResumeVersionSchema>;
export type CompareVersionsQuery = z.infer<typeof compareVersionsQuerySchema>;
