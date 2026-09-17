import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';
import * as client from '../api/client';

vi.mock('../api/client');

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders bell button and badge when unread count > 0', async () => {
    vi.mocked(client.getUnreadNotificationCount).mockResolvedValue({ unreadCount: 3 });

    render(<NotificationBell />);

    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Notifications \(3 unread\)/i })).toBeTruthy();
  });

  it('toggles notification popover and lists items', async () => {
    vi.mocked(client.getUnreadNotificationCount).mockResolvedValue({ unreadCount: 1 });
    vi.mocked(client.getNotifications).mockResolvedValue({
      notifications: [
        {
          id: 'n-1',
          userId: 'user-1',
          title: 'Roadmap Task Completed',
          message: 'You completed TypeScript basics!',
          type: 'ROADMAP_PROGRESS',
          read: false,
          metadata: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    render(<NotificationBell />);

    const button = await screen.findByRole('button', { name: /Notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Roadmap Task Completed')).toBeTruthy();
      expect(screen.getByText('You completed TypeScript basics!')).toBeTruthy();
    });
  });
});
