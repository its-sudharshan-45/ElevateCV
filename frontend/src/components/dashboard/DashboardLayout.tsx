
// cspell:disable
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CommandSearchModal } from './CommandSearchModal';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Optional pre-resolved userName (passed by pages that already have it, e.g. Dashboard). */
  userName?: string;
}

export function DashboardLayout({ children, userName: propUserName }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Real user identity from Supabase session — no hardcoded defaults
  const [resolvedUserName, setResolvedUserName] = useState<string>('');
  const [resolvedUserEmail, setResolvedUserEmail] = useState<string>('');

  useEffect(() => {
    // If the parent page already resolved the name, skip the extra fetch
    if (propUserName) {
      setResolvedUserName(propUserName);
      return;
    }

    async function loadUser() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (user) {
          const email = user.email ?? '';
          const name =
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            email.split('@')[0] ||
            '';
          setResolvedUserName(name ? name.charAt(0).toUpperCase() + name.slice(1) : '');
          setResolvedUserEmail(email);
        }
      } catch {
        // Not authenticated — TopHeader handles the empty state
      }
    }

    void loadUser();
  }, [propUserName]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#6E44FF] selection:text-white antialiased">
      <div className="flex flex-1 relative min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden md:block sticky top-0 h-screen z-40">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar
                isCollapsed={false}
                onToggleCollapse={() => {}}
                onMobileClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Top Header */}
          <TopHeader
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            userName={propUserName || resolvedUserName}
            userEmail={resolvedUserEmail}
          />

          {/* Main Dashboard Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="py-4 px-6 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400">
            <p>UpSkilr AI Career Command Center &copy; {new Date().getFullYear()} • Elevating tech candidates worldwide.</p>
          </footer>
        </div>
      </div>

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
