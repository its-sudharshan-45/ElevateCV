import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, ArrowRight, Sparkles, Zap } from 'lucide-react';

interface WelcomeBannerCardProps {
  userName?: string;
  resumeCount?: number;
}

export function WelcomeBannerCard({
  userName = 'User',
  resumeCount = 0,
}: WelcomeBannerCardProps) {
  const hasResumes = resumeCount > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-100 dark:border-purple-900/60 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      {/* Decorative ambient background glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top: Welcome title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {hasResumes
              ? `You have ${resumeCount} resume${resumeCount > 1 ? 's' : ''} uploaded. Analyze and improve your resume with AI.`
              : "Upload your first resume to get AI-powered analysis, ATS scoring, and improvement suggestions."}
          </p>
        </div>

        {/* Info Chips */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-purple-100 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300">
            <Zap className="w-3.5 h-3.5 text-[#6E44FF]" />
            <span>AI Resume Intelligence Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-purple-100 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-[#6E44FF]" />
            <span>{resumeCount} Resumes Uploaded</span>
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/profile/resumes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6E44FF] to-[#8C64FF] text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
          >
            <span>{hasResumes ? 'Open Resume Studio' : 'Upload Your Resume'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          {!hasResumes && (
            <Link
              to="/profile/resumes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-[#6E44FF] dark:text-purple-300 font-bold text-xs border border-purple-100 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-slate-700 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>Quick Upload</span>
            </Link>
          )}
        </div>
      </div>

      {/* Decorative badge on right (desktop) */}
      <div className="hidden lg:block absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-90">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse" />
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-white/60 backdrop-blur-md shadow-xl text-[#6E44FF]">
            <Sparkles className="w-12 h-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
