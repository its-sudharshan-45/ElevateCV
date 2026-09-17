import React from 'react';
import { Link } from 'react-router-dom';
import { SignupForm } from '@/features/auth/components/SignupForm';

export function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          ← Back to UpSkilr
        </Link>
      </div>
      <SignupForm />
    </main>
  );
}
