import { z } from 'zod';

export const createResumeVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be ≤ 200 characters').trim(),
  changesSummary: z.string().max(2000, 'Summary must be ≤ 2000 characters').trim().default(''),
});

export const compareVersionsQuerySchema = z.object({
  versionA: z.string().uuid('versionA must be a valid UUID'),
  versionB: z.string().uuid('versionB must be a valid UUID'),
});

export type CreateResumeVersionBody = z.infer<typeof createResumeVersionSchema>;
export type CompareVersionsQuery = z.infer<typeof compareVersionsQuerySchema>;
