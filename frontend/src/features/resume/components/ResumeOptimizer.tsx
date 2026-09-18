import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Tag,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { optimizeResume } from '@/features/resume/api/resume.api';
import type {
  JobMatchAnalysis,
  OptimizationResult,
  OptimizedSection,
  OptimizationSuggestion,
  KeywordImprovement,
} from '@/features/resume/types/resume';
import { ApiClientError } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResumeOptimizerProps {
  resumeId: string;
  analysisId: string;
  analysis: JobMatchAnalysis;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityColor(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 'text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/20';
  if (priority === 'medium') return 'text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/20';
  return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700';
}

function priorityLabel(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 'High';
  if (priority === 'medium') return 'Medium';
  return 'Low';
}

function sectionLabel(key: OptimizedSection['key']) {
  if (key === 'summary') return 'Professional Summary';
  if (key === 'experience') return 'Experience';
  if (key === 'projects') return 'Projects';
  return 'Skills';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionDiff({ section }: { section: OptimizedSection }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-expanded={expanded}
      >
        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {sectionLabel(section.key)}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-3 text-xs">
          {/* Original */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Original</p>
            <div className="p-3 rounded-xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/40 dark:border-rose-800/30 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {section.original}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-[#16A36A]" />
          </div>

          {/* Improved */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Improved</p>
            <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/40 dark:border-emerald-800/30 text-slate-900 dark:text-slate-100 leading-relaxed font-medium whitespace-pre-line">
              {section.improved}
            </div>
          </div>

          {/* Reason */}
          {section.reason && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{section.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: OptimizationSuggestion }) {
  return (
    <div className={`p-3.5 rounded-2xl border space-y-1 text-xs ${priorityColor(suggestion.priority)}`}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
          {priorityLabel(suggestion.priority)} Priority
        </span>
      </div>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{suggestion.text}</p>
      {suggestion.impact && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{suggestion.impact}</p>
      )}
    </div>
  );
}

function KeywordCard({ improvement }: { improvement: KeywordImprovement }) {
  return (
    <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 space-y-1 text-xs">
      <div className="flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-[#16A36A]" />
        <span className="font-bold text-slate-900 dark:text-slate-100">{improvement.keyword}</span>
      </div>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{improvement.suggestion}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ResumeOptimizer({ resumeId, analysisId, analysis }: ResumeOptimizerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'suggestions' | 'keywords' | 'warnings'>('sections');

  async function handleOptimize() {
    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const response = await optimizeResume(resumeId, analysisId);
      setResult(response.data);
      setStatus('success');
      // Auto-select the first tab with content, defaulting to sections
      if (response.data.optimizedSections.length > 0) setActiveTab('sections');
      else if (response.data.suggestions.length > 0) setActiveTab('suggestions');
      else if (response.data.keywordImprovements.length > 0) setActiveTab('keywords');
      else setActiveTab('sections');
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'AI optimization failed. Please try again.',
      );
    }
  }

  const missingSkillsCount = analysis.skillDetail?.missingRequired?.length ?? 0;
  const missingKeywordsCount = analysis.keywordDetail?.missing?.length ?? 0;

  return (
    <section
      id="resume-optimizer-section"
      className="rounded-3xl border border-[#16A36A]/20 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#16A36A]" />
            AI Resume Optimizer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate targeted improvements based on your ATS analysis.
            {missingSkillsCount > 0 && (
              <span className="ml-1 text-rose-600 dark:text-rose-400 font-semibold">
                {missingSkillsCount} missing required skill{missingSkillsCount !== 1 ? 's' : ''} detected.
              </span>
            )}
          </p>
        </div>

        {status === 'idle' || status === 'error' ? (
          <Button
            id="optimize-resume-btn"
            onClick={handleOptimize}
            className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white flex items-center gap-2 shadow-xs cursor-pointer px-5 py-2 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Optimize Resume</span>
          </Button>
        ) : null}
      </div>

      {/* Context summary (idle state) */}
      {status === 'idle' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 text-xs space-y-0.5">
            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Missing Required Skills</p>
            <p className="text-lg font-black text-rose-700 dark:text-rose-300">{missingSkillsCount}</p>
            {missingSkillsCount > 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">
                {analysis.skillDetail?.missingRequired?.slice(0, 3).join(', ')}
                {missingSkillsCount > 3 && ` +${missingSkillsCount - 3} more`}
              </p>
            )}
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 text-xs space-y-0.5">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Missing Keywords</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-300">{missingKeywordsCount}</p>
            {missingKeywordsCount > 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">
                {analysis.keywordDetail?.missing?.slice(0, 3).join(', ')}
                {missingKeywordsCount > 3 && ` +${missingKeywordsCount - 3} more`}
              </p>
            )}
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-0.5">
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Current ATS Score</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{analysis.matchScore}/100</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">{analysis.category}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center py-12 space-y-4 text-center"
        >
          <div className="relative">
            <Loader2 className="w-10 h-10 text-[#16A36A] animate-spin" />
            <Sparkles className="w-4 h-4 text-[#16A36A] absolute -top-1 -right-1" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">AI is analyzing your resume…</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
              Generating targeted improvements based on your ATS analysis and job description. This may take up to 30 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-700 dark:text-rose-400">Optimization failed</p>
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success: Results */}
      {status === 'success' && result && (
        <div className="space-y-5">
          {/* Anti-hallucination notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7FAF8] dark:bg-slate-800/40 border border-[#16A36A]/20 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#16A36A] dark:text-emerald-400">Grounded in your resume. </span>
              <span className="text-slate-600 dark:text-slate-400">
                All improvements use only facts from your original resume. Review each change before accepting. Run a new ATS analysis after editing to measure your score improvement.
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
            {[
              { id: 'sections', label: `Sections (${result.optimizedSections.length})` },
              { id: 'suggestions', label: `Suggestions (${result.suggestions.length})` },
              { id: 'keywords', label: `Keywords (${result.keywordImprovements.length})` },
              ...(result.warnings.length > 0 ? [{ id: 'warnings', label: `Warnings (${result.warnings.length})` }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#16A36A] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Optimized Sections Tab */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              {result.optimizedSections.length > 0 ? (
                result.optimizedSections.map((section, idx) => (
                  <SectionDiff key={`${section.key}-${idx}`} section={section} />
                ))
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-500">
                  <Info className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span>No section improvements were generated. Your content may already be well-aligned with the job description.</span>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              {result.suggestions.length > 0 ? (
                result.suggestions.map((s, idx) => (
                  <SuggestionCard key={idx} suggestion={s} />
                ))
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-500">
                  <Info className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span>No additional suggestions at this time.</span>
                </div>
              )}
            </div>
          )}

          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-3">
              {result.keywordImprovements.length > 0 ? (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-[#16A36A] flex-shrink-0 mt-0.5" />
                    These keywords were found in the job description but not in your resume. Incorporate them naturally if you genuinely have relevant experience.
                  </p>
                  {result.keywordImprovements.map((k, idx) => (
                    <KeywordCard key={idx} improvement={k} />
                  ))}
                </>
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>No significant keyword gaps detected. Your resume already covers the key terms from the job description.</span>
                </div>
              )}
            </div>
          )}

          {/* Warnings Tab */}
          {activeTab === 'warnings' && result.warnings.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                These are anti-hallucination notices — skills or facts the AI identified as missing from your resume but chose not to fabricate.
              </p>
              {result.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Re-optimize button */}
          <div className="flex justify-end pt-2">
            <Button
              id="re-optimize-resume-btn"
              onClick={handleOptimize}
              variant="outline"
              className="rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-Optimize</span>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
