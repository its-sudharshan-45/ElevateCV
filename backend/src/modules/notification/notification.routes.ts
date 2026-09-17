import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.controller.js';

// Mounted under /api/v1/notifications
export const notificationRouter = Router();

notificationRouter.get('/', asyncHandler(requireAuth), asyncHandler(listNotifications));
notificationRouter.get(
  '/unread-count',
  asyncHandler(requireAuth),
  asyncHandler(getUnreadCount),
);
notificationRouter.patch(
  '/:id/read',
  asyncHandler(requireAuth),
  asyncHandler(markNotificationRead),
);
notificationRouter.patch(
  '/read-all',
  asyncHandler(requireAuth),
  asyncHandler(markAllNotificationsRead),
);
