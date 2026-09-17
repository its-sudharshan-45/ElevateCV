import React from 'react';
import { Link } from 'react-router-dom';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6E44FF] dark:text-purple-400">
            Candidate Profile
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Your Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tell us about yourself so our AI can optimize resume analysis and ATS matching.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/profile/resumes">Manage Resumes</Link>
            </Button>
          </div>
        </header>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <ProfileForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
