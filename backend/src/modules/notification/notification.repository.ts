import { getSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';
import type { CreateNotificationInput, NotificationRecord } from './notification.types.js';

export class NotificationRepository {
  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const { data, error } = await getSupabaseAdmin()
      .from('notifications')
      .insert({
        user_id: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        metadata: input.metadata ?? null,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create notification', 500, 'DATABASE_ERROR');
    }

    return data as NotificationRecord;
  }

  async listForUser(
    userId: string,
    options: { page: number; limit: number; unreadOnly: boolean },
  ): Promise<{ records: NotificationRecord[]; total: number }> {
    const offset = (options.page - 1) * options.limit;

    let query = getSupabaseAdmin()
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + options.limit - 1);

    if (options.unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new AppError('Failed to list notifications', 500, 'DATABASE_ERROR');
    }

    return { records: (data ?? []) as NotificationRecord[], total: count ?? 0 };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await getSupabaseAdmin()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new AppError('Failed to count unread notifications', 500, 'DATABASE_ERROR');
    }

    return count ?? 0;
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to mark notification as read', 500, 'DATABASE_ERROR');
    }

    return data as NotificationRecord | null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await getSupabaseAdmin()
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select('id');

    if (error) {
      throw new AppError('Failed to mark all notifications as read', 500, 'DATABASE_ERROR');
    }

    return (data ?? []).length;
  }
}

export const notificationRepository = new NotificationRepository();
