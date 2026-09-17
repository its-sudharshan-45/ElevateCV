import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Zap, Target, History, Sparkles, Bell } from 'lucide-react';
import { getNotifications } from '@/features/notification/api/client';
import type { NotificationItem, NotificationType } from '@/features/notification/types';

function getActivityIcon(type: NotificationType) {
  switch (type) {
    case 'RESUME_ANALYSIS':
      return { Icon: Sparkles, bg: 'bg-purple-100 dark:bg-purple-900/60', color: 'text-[#6E44FF] dark:text-purple-300' };
    case 'JOB_MATCH':
      return { Icon: Target, bg: 'bg-rose-100 dark:bg-rose-900/60', color: 'text-rose-600 dark:text-rose-300' };
    case 'ROADMAP_PROGRESS':
      return { Icon: Zap, bg: 'bg-amber-100 dark:bg-amber-900/60', color: 'text-amber-600 dark:text-amber-300' };
    default:
      return { Icon: Bell, bg: 'bg-blue-100 dark:bg-blue-900/60', color: 'text-blue-600 dark:text-blue-300' };
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

/** Static fallback activity items used when there are no real notifications yet */
const STATIC_ACTIVITIES = [
  { id: 's1', title: 'Upload your first resume to get started', Icon: FileText, bg: 'bg-blue-100 dark:bg-blue-900/60', color: 'text-blue-600 dark:text-blue-300', time: '' },
  { id: 's2', title: 'Run an ATS job match analysis', Icon: Target, bg: 'bg-rose-100 dark:bg-rose-900/60', color: 'text-rose-600 dark:text-rose-300', time: '' },
  { id: 's3', title: 'Save a resume version snapshot', Icon: History, bg: 'bg-emerald-100 dark:bg-emerald-900/60', color: 'text-emerald-600 dark:text-emerald-300', time: '' },
];

export function RecentActivityFeed() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getNotifications({ limit: 5 });
        setNotifications(res.notifications);
      } catch {
        // Silently fail — show static fallback
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Resume intelligence timeline</p>
        </div>
        <Link
          to="/notifications"
          className="text-[11px] font-bold text-[#6E44FF] dark:text-purple-400 hover:underline"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-start gap-3 animate-pulse">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      ) : notifications.length > 0 ? (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const { Icon, bg, color } = getActivityIcon(n.type);
            return (
              <li key={n.id} className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug line-clamp-1">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-3">
          {STATIC_ACTIVITIES.map(({ id, title, Icon, bg, color }) => (
            <li key={id} className="flex items-start gap-3 opacity-60">
              <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                  {title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 italic">Get started →</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
