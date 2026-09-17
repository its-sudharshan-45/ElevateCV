import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, User, FileUp, Target, Sparkles, History } from 'lucide-react';

interface OnboardingStep {
  number: number;
  title: string;
  subtitle: string;
  actionText: string;
  actionHref: string;
  isCompleted: boolean;
  icon: React.ElementType;
}

export function NewUserOnboardingCard() {
  const steps: OnboardingStep[] = [
    {
      number: 1,
      title: 'Complete your profile',
      subtitle: 'Add your name, education, and skills background',
      actionText: 'Start Profile',
      actionHref: '/profile',
      isCompleted: false,
      icon: User,
    },
    {
      number: 2,
      title: 'Upload your resume',
      subtitle: 'Upload PDF to initialize AI analysis engine',
      actionText: 'Upload Resume',
      actionHref: '/profile/resumes',
      isCompleted: false,
      icon: FileUp,
    },
    {
      number: 3,
      title: 'Analyze your resume',
      subtitle: 'Get AI-powered quality score and improvement suggestions',
      actionText: 'Analyze Now',
      actionHref: '/profile/resumes',
      isCompleted: false,
      icon: Sparkles,
    },
    {
      number: 4,
      title: 'Run ATS job match',
      subtitle: 'Paste a job description to see your match score and gaps',
      actionText: 'Run Match',
      actionHref: '/profile/resumes',
      isCompleted: false,
      icon: Target,
    },
    {
      number: 5,
      title: 'Save a version snapshot',
      subtitle: 'Track resume improvements over time with version history',
      actionText: 'Save Version',
      actionHref: '/profile/resumes',
      isCompleted: false,
      icon: History,
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome to UpSkilr 👋
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Let&apos;s set up your AI-powered Resume Intelligence profile step-by-step.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-950/60 p-3 rounded-2xl border border-purple-100 dark:border-purple-800">
          <div className="text-right">
            <p className="text-xs font-extrabold text-[#6E44FF] dark:text-purple-300">
              {completedCount} of {steps.length} Completed
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">{progressPercent}% Setup Ready</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#6E44FF] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                step.isCompleted
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:border-purple-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center border border-slate-200 shadow-2xs">
                    {step.number}
                  </span>
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {step.subtitle}
                </p>
              </div>

              <Link
                to={step.actionHref}
                className={`w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  step.isCompleted
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-[#6E44FF] hover:bg-purple-700 text-white shadow-2xs'
                }`}
              >
                <span>{step.isCompleted ? 'View' : step.actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
