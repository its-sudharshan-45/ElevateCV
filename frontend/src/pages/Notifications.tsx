import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Bell, Check, CheckCheck, Sparkles, Target, Zap, History, FileText } from 'lucide-react';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/features/notification/api/client';
import type { NotificationItem, NotificationType } from '@/features/notification/types';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'RESUME_ANALYSIS':
      return Sparkles;
    case 'JOB_MATCH':
      return Target;
    case 'ROADMAP_PROGRESS':
      return Zap;
    default:
      return Bell;
  }
}

function getNotificationIconStyle(type: NotificationType) {
  switch (type) {
    case 'RESUME_ANALYSIS':
      return 'bg-purple-50 dark:bg-purple-950/60 text-[#6E44FF] dark:text-purple-300';
    case 'JOB_MATCH':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300';
    case 'ROADMAP_PROGRESS':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300';
    default:
      return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300';
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getNotifications({ limit: 50 });
      setNotifications(res.notifications);
    } catch {
      setError('Unable to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAsRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // Ignore
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  }

  const hasUnread = notifications.some((n) => !n.read);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#6E44FF] dark:text-purple-400">
              Activity Alerts
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Notifications Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stay updated with resume analysis results, job match scores, and AI activity.
            </p>
          </div>
          {hasUnread && (
            <button
              onClick={() => void handleMarkAllAsRead()}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Unread count badge */}
        {!isLoading && unreadCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6E44FF]/10 dark:bg-purple-900/30 border border-[#6E44FF]/20">
            <span className="w-2 h-2 rounded-full bg-[#6E44FF] animate-pulse" />
            <span className="text-xs font-bold text-[#6E44FF] dark:text-purple-300">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{error}</p>
              <button
                onClick={() => void fetchNotifications()}
                type="button"
                className="mt-3 text-xs font-bold text-[#6E44FF] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">No notifications yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Notifications will appear here after you upload and analyze a resume.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => {
                const Icon = getNotificationIcon(n.type);
                const iconStyle = getNotificationIconStyle(n.type);
                return (
                  <div
                    key={n.id}
                    className={`py-4 flex items-start gap-4 transition-opacity ${n.read ? 'opacity-60' : ''}`}
                  >
                    <div className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${iconStyle}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          className={`text-sm font-extrabold truncate ${
                            n.read
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {n.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap flex-shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => void handleMarkAsRead(n.id)}
                        type="button"
                        title="Mark as read"
                        className="flex-shrink-0 mt-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#6E44FF] transition-colors"
                        aria-label="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
