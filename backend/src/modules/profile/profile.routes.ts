import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { getProfile, patchProfile } from './profile.controller.js';
import { updateProfileSchema } from './profile.schema.js';

export const profileRouter = Router();

profileRouter.get('/', asyncHandler(requireAuth), asyncHandler(getProfile));
profileRouter.patch(
  '/',
  asyncHandler(requireAuth),
  validateRequest(updateProfileSchema),
  asyncHandler(patchProfile),
);