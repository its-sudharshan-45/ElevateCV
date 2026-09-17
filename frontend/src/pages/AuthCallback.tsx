import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { AUTH_ROUTES } from '@/features/auth/constants';
import { Loader2 } from 'lucide-react';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      const code = searchParams.get('code');
      const nextParam = searchParams.get('next');
      const destination =
        nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
          ? nextParam
          : AUTH_ROUTES.dashboard;

      const supabase = createClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (isMounted) {
            setErrorMsg('OAuth authentication failed. Redirecting to login…');
            setTimeout(() => navigate(`${AUTH_ROUTES.login}?error=oauth_exchange_failed`, { replace: true }), 1500);
          }
          return;
        }
      } else {
        // Check if session was already picked up from URL hash
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) {
            setErrorMsg('No authentication code or session found. Redirecting to login…');
            setTimeout(() => navigate(`${AUTH_ROUTES.login}?error=oauth_no_code`, { replace: true }), 1500);
          }
          return;
        }
      }

      if (isMounted) {
        navigate(destination, { replace: true });
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {errorMsg || 'Completing sign in…'}
        </p>
      </div>
    </div>
  );
}
