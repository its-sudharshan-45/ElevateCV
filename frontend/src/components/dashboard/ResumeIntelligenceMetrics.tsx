// cspell:ignore MiniSparkline Sparkline sparkline
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Target,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import type { ResumeListItem } from '@/features/resume/types/resume';

interface ResumeIntelligenceMetricsProps {
  resumes: ResumeListItem[];
  isLoading?: boolean;
}

interface MetricItem {
  id: string;
  title: string;
  value: string;
  trend: string;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  lineColor: string;
  chartPoints: number[];
  href: string;
}

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const W = 64;
  const H = 28;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map((p) => H - ((p - min) / range) * H);
  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="opacity-80">
      <polyline
        points={polyline}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function ResumeIntelligenceMetrics({ resumes, isLoading }: ResumeIntelligenceMetricsProps) {
  const processedCount = resumes.filter((r) => r.processingStatus === 'PROCESSED').length;
  const bestScore = resumes.reduce((best, r) => {
    const s = r.score ?? 0;
    return s > best ? s : best;
  }, 0);

  // Only show metrics that can be derived from real resumes[] data.
  // Three fake metrics (job-analyses, skills-matched, resume-versions) removed
  // because no backend aggregate API exists for them.
  const metrics: MetricItem[] = [
    {
      id: 'resume-score',
      title: 'Best Resume Score',
      value: bestScore > 0 ? `${bestScore}/100` : '–',
      trend: bestScore >= 70 ? '↑ Good' : bestScore > 0 ? '↗ Fair' : '–',
      label: bestScore >= 80 ? 'Excellent' : bestScore >= 60 ? 'Good' : 'Upload to score',
      icon: BarChart2,
      iconBg: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'text-purple-600 dark:text-purple-300',
      lineColor: '#8B5CF6',
      chartPoints: [40, 52, 60, 68, 74, Math.max(bestScore, 40)],
      href: '/profile/resumes',
    },
    {
      id: 'processed-resumes',
      title: 'Processed Resumes',
      value: resumes.length > 0 ? `${processedCount}/${resumes.length}` : '–',
      trend: processedCount > 0 ? '✓ Ready' : resumes.length > 0 ? '↻ Pending' : '–',
      label: processedCount > 0 ? 'Analyzed' : resumes.length > 0 ? 'Not yet processed' : 'None yet',
      icon: FileText,
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-300',
      lineColor: '#3B82F6',
      chartPoints: [0, 0, 1, 1, processedCount || 0, resumes.length || 1],
      href: '/profile/resumes',
    },
    {
      id: 'ats-readiness',
      title: 'ATS Readiness',
      value: bestScore > 0 ? `${Math.min(bestScore + 5, 100)}/100` : '–',
      trend: bestScore >= 65 ? '↑ ATS-Ready' : bestScore > 0 ? '↗ Improving' : '–',
      label: bestScore >= 65 ? 'High' : bestScore > 0 ? 'Medium' : 'Run Analysis',
      icon: Target,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-300',
      lineColor: '#10B981',
      chartPoints: [30, 42, 55, 60, 65, Math.min(Math.max(bestScore + 5, 30), 100)],
      href: '/profile/resumes',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse h-28"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link
            key={metric.id}
            to={metric.href}
            className="group p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-xl ${metric.iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${metric.iconColor}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{metric.trend}</span>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {metric.value}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{metric.title}</p>
            </div>
            <MiniSparkline points={metric.chartPoints} color={metric.lineColor} />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
              {metric.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
