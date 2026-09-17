import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
          <p className="text-sm font-medium text-slate-500">Checking authorization…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const nextDestination = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextDestination}`} replace />;
  }

  return <Outlet />;
}
