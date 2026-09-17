import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const mockGetUser = vi.fn();

vi.mock('../../config/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  createSupabaseClient: vi.fn(),
}));

vi.mock('./notification.repository.js', () => ({
  notificationRepository: {
    create: vi.fn(),
    listForUser: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

import { notificationRepository } from './notification.repository.js';

const USER_A = '11111111-1111-1111-1111-111111111111';
const NOTIFICATION_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const ACCESS_TOKEN = 'valid-access-token';

const sampleRecord = {
  id: NOTIFICATION_ID,
  user_id: USER_A,
  title: 'Resume analyzed',
  message: 'Your resume scored 85.',
  type: 'RESUME_ANALYSIS' as const,
  read: false,
  metadata: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function authHeader(token = ACCESS_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

describe('Notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_A, email: 'jane@example.com' } },
      error: null,
    });
  });

  it('returns 401 for unauthenticated list', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('lists paginated notifications', async () => {
    vi.mocked(notificationRepository.listForUser).mockResolvedValue({
      records: [sampleRecord],
      total: 1,
    });

    const app = createApp();
    const res = await request(app).get('/api/v1/notifications').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].type).toBe('RESUME_ANALYSIS');
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
  });

  it('supports unreadOnly filter', async () => {
    vi.mocked(notificationRepository.listForUser).mockResolvedValue({
      records: [sampleRecord],
      total: 1,
    });

    const app = createApp();
    await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set(authHeader());

    expect(notificationRepository.listForUser).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ unreadOnly: true }),
    );
  });

  it('returns unread count', async () => {
    vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue(3);

    const app = createApp();
    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(3);
  });

  it('marks a notification as read', async () => {
    vi.mocked(notificationRepository.markAsRead).mockResolvedValue({
      ...sampleRecord,
      read: true,
    });

    const app = createApp();
    const res = await request(app)
      .patch(`/api/v1/notifications/${NOTIFICATION_ID}/read`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(true);
  });

  it('returns 404 when marking non-existent notification', async () => {
    vi.mocked(notificationRepository.markAsRead).mockResolvedValue(null);

    const app = createApp();
    const res = await request(app)
      .patch(`/api/v1/notifications/${NOTIFICATION_ID}/read`)
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('marks all notifications as read', async () => {
    vi.mocked(notificationRepository.markAllAsRead).mockResolvedValue(5);

    const app = createApp();
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(5);
  });
});
