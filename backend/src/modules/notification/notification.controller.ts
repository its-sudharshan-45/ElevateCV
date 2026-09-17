import { Request, Response } from 'express';
import { AppError } from '../../utils/errors.js';
import { getRouteParam } from '../../utils/route-params.js';
import { listNotificationsQuerySchema } from './notification.schema.js';
import { notificationService } from './notification.service.js';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const query = listNotificationsQuerySchema.parse(req.query);
  const result = await notificationService.listNotifications(req.user.id, {
    page: query.page,
    limit: query.limit,
    unreadOnly: query.unreadOnly,
  });

  res.status(200).json(result);
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const result = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json(result);
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const id = getRouteParam(req.params, 'id');
  const notification = await notificationService.markAsRead(id, req.user.id);
  res.status(200).json({ notification });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const result = await notificationService.markAllAsRead(req.user.id);
  res.status(200).json(result);
}
