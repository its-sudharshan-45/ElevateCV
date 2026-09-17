import { Request, Response } from 'express';
import { AppError } from '../../utils/errors.js';
import type { UpdateProfileBody } from './profile.schema.js';
import { profileService } from './profile.service.js';

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const profile = await profileService.getProfile(req.user.id);
  res.status(200).json({ profile });
}

export async function patchProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const body = req.body as UpdateProfileBody;
  const profile = await profileService.updateProfile(req.user.id, body);
  res.status(200).json({ profile });
}
