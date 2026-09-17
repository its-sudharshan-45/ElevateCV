import { AppError } from '../../utils/errors.js';
import { notificationRepository } from './notification.repository.js';
import type {
  CreateNotificationInput,
  NotificationRecord,
  NotificationResponse,
  NotificationType,
  PaginatedNotificationsResult,
  UnreadCountResponse,
} from './notification.types.js';

function toResponse(record: NotificationRecord): NotificationResponse {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    message: record.message,
    type: record.type,
    read: record.read,
    metadata: record.metadata,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export class NotificationService {
  /**
   * Create a notification for a user — called by other services (resume analysis,
   * roadmap completion, job matching) when a relevant event occurs.
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationResponse> {
    const record = await notificationRepository.create(input);
    return toResponse(record);
  }

  async listNotifications(
    userId: string,
    options: { page: number; limit: number; unreadOnly: boolean },
  ): Promise<PaginatedNotificationsResult> {
    const { records, total } = await notificationRepository.listForUser(userId, options);
    return {
      notifications: records.map(toResponse),
      total,
      page: options.page,
      limit: options.limit,
    };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const unreadCount = await notificationRepository.getUnreadCount(userId);
    return { unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
    const record = await notificationRepository.markAsRead(notificationId, userId);
    if (!record) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    return toResponse(record);
  }

  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await notificationRepository.markAllAsRead(userId);
    return { updatedCount };
  }

  /**
   * Convenience factory for dispatching typed notifications from other services.
   */
  async dispatch(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.createNotification({ userId, type, title, message, metadata });
  }
}

export const notificationService = new NotificationService();
