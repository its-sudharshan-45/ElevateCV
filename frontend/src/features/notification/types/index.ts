export type NotificationType =
  | 'ROADMAP_PROGRESS'
  | 'RESUME_ANALYSIS'
  | 'JOB_MATCH'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
