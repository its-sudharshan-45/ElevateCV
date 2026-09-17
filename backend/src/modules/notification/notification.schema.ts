import { z } from 'zod';
import { NOTIFICATION_TYPES } from './notification.types.js';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
