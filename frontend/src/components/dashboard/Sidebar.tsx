import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Bookmark,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Resume Studio', href: '/profile/resumes', icon: FileText },
  ];

  const secondaryNavItems = [
    { label: 'Saved Analyses', href: '/saved', icon: Bookmark },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: '3' },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800/80">
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#6E44FF] to-[#8C64FF] text-white shadow-md shadow-purple-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              UpSkilr
            </span>
          )}
        </Link>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Main Group */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onMobileClose}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F0EBFF] dark:bg-purple-950/50 text-[#6E44FF] dark:text-purple-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#6E44FF] dark:text-purple-300' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Secondary Group */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onMobileClose}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F0EBFF] dark:bg-purple-950/50 text-[#6E44FF] dark:text-purple-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#6E44FF] dark:text-purple-300' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Promo Card (matching reference image) */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-purple-500/10 dark:from-amber-950/40 dark:to-purple-950/40 border border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center gap-2 mb-1.5 text-amber-700 dark:text-amber-300">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span className="text-xs font-bold">Go Premium</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            Unlock advanced insights and premium features.
          </p>
          <Link
            to="/settings"
            className="mt-3 w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-white dark:bg-slate-800 text-[#6E44FF] dark:text-purple-300 font-bold text-xs shadow-xs hover:bg-slate-50 border border-purple-100 dark:border-purple-900 transition-colors"
          >
            Upgrade Now →
          </Link>
        </div>
      )}

      {/* Logout button */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Sign out of account"
        >
          <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
