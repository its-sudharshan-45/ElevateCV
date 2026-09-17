
import React from 'react';
import type { NotificationItem } from '../types';

interface NotificationListProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationListProps) {
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="w-80 rounded-xl border bg-card p-4 shadow-lg text-card-foreground">
      <div className="flex items-center justify-between border-b pb-2 mb-3">
        <h4 className="font-semibold text-sm">Notifications</h4>
        {hasUnread ? (
          <button
            onClick={onMarkAllAsRead}
            type="button"
            className="text-xs text-primary hover:underline font-medium"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No notifications yet.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg p-2.5 text-xs transition-colors border ${
                n.read ? 'bg-background opacity-75' : 'bg-muted/40 font-medium border-primary/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-foreground">{n.title}</p>
                {!n.read ? (
                  <button
                    onClick={() => onMarkAsRead(n.id)}
                    type="button"
                    className="text-[10px] text-primary hover:underline whitespace-nowrap"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 leading-normal">{n.message}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
