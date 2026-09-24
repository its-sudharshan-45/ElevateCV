import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  compareVersions,
  createVersion,
  deleteVersion,
  getVersion,
  listVersions,
  restoreVersion,
} from './resume-version.controller.js';

// Mounted under /api/v1/resumes/:resumeId/versions
export const resumeVersionRouter = Router({ mergeParams: true });

resumeVersionRouter.post('/', asyncHandler(requireAuth), asyncHandler(createVersion));
resumeVersionRouter.get('/', asyncHandler(requireAuth), asyncHandler(listVersions));
resumeVersionRouter.get('/compare', asyncHandler(requireAuth), asyncHandler(compareVersions));
resumeVersionRouter.get('/:versionId', asyncHandler(requireAuth), asyncHandler(getVersion));
resumeVersionRouter.post('/:versionId/restore', asyncHandler(requireAuth), asyncHandler(restoreVersion));
resumeVersionRouter.delete('/:versionId', asyncHandler(requireAuth), asyncHandler(deleteVersion));
