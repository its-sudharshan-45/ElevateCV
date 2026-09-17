import { authenticatedApiFetch } from '@/lib/api/client';
import type {
  NotificationItem,
  PaginatedNotifications,
  UnreadCountResponse,
} from '@/features/notification/types';

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<PaginatedNotifications> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.unreadOnly) query.set('unreadOnly', 'true');

  const queryString = query.toString();
  const path = `/notifications${queryString ? `?${queryString}` : ''}`;

  return authenticatedApiFetch<PaginatedNotifications>(path);
}

export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  return authenticatedApiFetch<UnreadCountResponse>('/notifications/unread-count');
}

export async function markNotificationAsRead(id: string): Promise<{ notification: NotificationItem }> {
  return authenticatedApiFetch<{ notification: NotificationItem }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(): Promise<{ updatedCount: number }> {
  return authenticatedApiFetch<{ updatedCount: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
