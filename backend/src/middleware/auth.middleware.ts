import { NextFunction, Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import type { AuthenticatedUser } from './auth.types.js';

export type { AuthenticatedUser };

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR'));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    next(new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR'));
    return;
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !data.user) {
      next(new AppError('Invalid or expired token', 401, 'AUTHENTICATION_ERROR'));
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    } satisfies AuthenticatedUser;

    next();
  } catch {
    next(new AppError('Authentication service unavailable', 503, 'EXTERNAL_SERVICE_ERROR'));
  }
}

export function requireOwnership(resourceUserId: string, authenticatedUserId: string): void {
  if (resourceUserId !== authenticatedUserId) {
    throw new AppError('Access denied', 403, 'AUTHORIZATION_ERROR');
  }
}
