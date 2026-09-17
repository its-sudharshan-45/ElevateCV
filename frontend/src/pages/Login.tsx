import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          ← Back to UpSkilr
        </Link>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground" role="status">
            Loading login form…
          </p>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
