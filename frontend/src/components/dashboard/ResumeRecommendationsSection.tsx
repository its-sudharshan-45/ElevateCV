import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Zap, ArrowUpRight, Target, History, ChevronRight } from 'lucide-react';

interface ActionItem {
  id: string;
  title: string;
  reason: string;
  priority: 'High Priority' | 'High' | 'Medium' | 'Quick Win';
  priorityColor: string;
  ctaText: string;
  ctaHref: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

export function ResumeRecommendationsSection() {
  const actions: ActionItem[] = [
    {
      id: '1',
      title: 'Run ATS Job Match Analysis',
      reason: 'Paste a job description to see your match score and missing keywords',
      priority: 'High Priority',
      priorityColor:
        'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200',
      ctaText: 'Analyze Now',
      ctaHref: '/profile/resumes',
      icon: Target,
      iconBg: 'bg-rose-50 dark:bg-rose-950/50',
      iconColor: 'text-rose-500 dark:text-rose-300',
    },
    {
      id: '2',
      title: 'Review AI Resume Improvement Suggestions',
      reason: 'AI has generated personalized recommendations to improve your resume score',
      priority: 'High',
      priorityColor:
        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200',
      ctaText: 'View Suggestions',
      ctaHref: '/profile/resumes',
      icon: Zap,
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'text-amber-500 dark:text-amber-300',
    },
    {
      id: '3',
      title: 'Upload Latest Resume Version',
      reason: 'Keep your resume up to date to ensure the most accurate analysis',
      priority: 'Medium',
      priorityColor:
        'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-200',
      ctaText: 'Upload Resume',
      ctaHref: '/profile/resumes',
      icon: FileText,
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-500 dark:text-blue-300',
    },
    {
      id: '4',
      title: 'Save a Resume Version Snapshot',
      reason: 'Track your improvements over time by creating a version comparison',
      priority: 'Quick Win',
      priorityColor:
        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200',
      ctaText: 'Save Version',
      ctaHref: '/profile/resumes',
      icon: History,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-500 dark:text-emerald-300',
    },
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Recommended Actions
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">AI-powered resume improvement steps</p>
        </div>
        <Link
          to="/profile/resumes"
          className="text-[11px] font-bold text-[#6E44FF] dark:text-purple-400 hover:underline flex items-center gap-1"
        >
          Open Studio <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 border border-transparent hover:border-purple-100 dark:hover:border-purple-900 transition-all duration-150 group"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${action.iconBg}`}>
                <Icon className={`w-4 h-4 ${action.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {action.title}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.priorityColor}`}
                  >
                    {action.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {action.reason}
                </p>
              </div>
              <Link
                to={action.ctaHref}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6E44FF] text-white font-bold text-[11px] shadow-sm hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100"
              >
                {action.ctaText}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
