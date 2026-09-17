import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6E44FF] to-[#8C64FF] text-white shadow-lg mb-6">
        <Sparkles className="w-7 h-7" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">404</h1>
      <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">Page Not Found</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        The page you are looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-sm shadow transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
