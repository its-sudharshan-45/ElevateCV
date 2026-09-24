import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { ApiClientError } from '@/lib/api/client';
import {
  compareResumeVersions,
  createResumeVersion,
  deleteResumeVersion,
  listResumeVersions,
  restoreResumeVersion,
  type ResumeVersion,
  type ResumeVersionComparison,
} from '../api/resume-version.api';
import type { ResumeVersionSource } from '../types/resume';
import { ResumeVersionDiff } from './ResumeVersionDiff';
import {
  History,
  RotateCcw,
  Sparkles,
  Edit3,
  CheckCircle2,
  FileText,
  Trash2,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface ResumeVersionManagerProps {
  resumeId: string;
  processingStatus: string;
  onOpenVersion?: (version: ResumeVersion) => void;
  onVersionListChange?: (versions: ResumeVersion[]) => void;
}

function sourceBadge(source?: ResumeVersionSource) {
  switch (source) {
    case 'AI_OPTIMIZED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <Sparkles className="w-2.5 h-2.5" /> AI Optimized
        </span>
      );
    case 'MANUAL_EDIT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
          <Edit3 className="w-2.5 h-2.5" /> Manual Edit
        </span>
      );
    case 'RESTORED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <RotateCcw className="w-2.5 h-2.5" /> Restored
        </span>
      );
    case 'ORIGINAL':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <FileText className="w-2.5 h-2.5" /> Original
        </span>
      );
  }
}

export function ResumeVersionManager({
  resumeId,
  processingStatus,
  onOpenVersion,
  onVersionListChange,
}: ResumeVersionManagerProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Snapshot creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comparison state
  const [selectedVersionA, setSelectedVersionA] = useState<string | null>(null);
  const [selectedVersionB, setSelectedVersionB] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ResumeVersionComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Restoring state
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listResumeVersions(resumeId);
      setVersions(data.versions);
      onVersionListChange?.(data.versions);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to load resume versions.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, onVersionListChange]);

  useEffect(() => {
    void fetchVersions();
  }, [fetchVersions]);

  async function handleCreateVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await createResumeVersion(resumeId, title.trim(), changesSummary.trim());
      const updated = [data.version, ...versions.map((v) => ({ ...v, isCurrent: false }))];
      setVersions(updated);
      onVersionListChange?.(updated);
      setTitle('');
      setChangesSummary('');
      setIsCreating(false);
      setSuccessMessage(`Created version v${data.version.versionNumber} snapshot successfully.`);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to create version snapshot.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRestoreVersion(versionId: string) {
    const target = versions.find((v) => v.id === versionId);
    const label = target ? `v${target.versionNumber} (${target.title})` : 'this version';

    if (
      !window.confirm(
        `Restore ${label}? A new immutable version will be created from this snapshot. Previous versions will remain safely preserved in history.`,
      )
    ) {
      return;
    }

    setRestoringVersionId(versionId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await restoreResumeVersion(resumeId, versionId);
      // New version is created and becomes current; historical versions remain intact
      const updated = [
        response.version,
        ...versions.map((v) => ({ ...v, isCurrent: false })),
      ];
      setVersions(updated);
      onVersionListChange?.(updated);
      setSuccessMessage(
        `Successfully restored snapshot as new version v${response.version.versionNumber}: ${response.version.title}`,
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to restore resume version.',
      );
    } finally {
      setRestoringVersionId(null);
    }
  }

  async function handleCompare() {
    if (!selectedVersionA || !selectedVersionB) return;
    if (selectedVersionA === selectedVersionB) {
      setError('Select two different versions to compare.');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const data = await compareResumeVersions(resumeId, selectedVersionA, selectedVersionB);
      setComparison(data.comparison);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to compare versions.',
      );
    } finally {
      setIsComparing(false);
    }
  }

  async function handleDeleteVersion(versionId: string) {
    if (!window.confirm('Delete this version snapshot? Historical records cannot be recovered after deletion.')) {
      return;
    }

    setError(null);
    try {
      await deleteResumeVersion(resumeId, versionId);
      const updated = versions.filter((v) => v.id !== versionId);
      setVersions(updated);
      onVersionListChange?.(updated);
      if (selectedVersionA === versionId) setSelectedVersionA(null);
      if (selectedVersionB === versionId) setSelectedVersionB(null);
      if (comparison?.versionA.id === versionId || comparison?.versionB.id === versionId) {
        setComparison(null);
      }
      setSuccessMessage('Version deleted successfully.');
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to delete version.',
      );
    }
  }

  const isProcessed = processingStatus === 'PROCESSED';

  return (
    <section
      aria-labelledby="resume-versions-heading"
      className="space-y-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 id="resume-versions-heading" className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-[#16A36A]" />
            Resume Version Management ({versions.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable point-in-time snapshots. Restoring a version creates a new version while preserving historical records.
          </p>
        </div>
        {isProcessed ? (
          <Button
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? 'outline' : 'default'}
            size="sm"
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            {isCreating ? 'Cancel' : 'Create Snapshot'}
          </Button>
        ) : (
          <p className="text-xs text-amber-600 font-medium">
            Processing required before creating snapshots
          </p>
        )}
      </div>

      <FormMessage message={error ?? undefined} />
      {successMessage ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* Create Version Form */}
      {isCreating ? (
        <form onSubmit={handleCreateVersion} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#16A36A]" /> New Version Snapshot
          </h4>
          <div className="space-y-1">
            <label htmlFor="version-title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Version Title *
            </label>
            <input
              id="version-title"
              type="text"
              required
              placeholder="e.g., Updated with React Native experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="version-summary" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Changes Summary (optional)
            </label>
            <textarea
              id="version-summary"
              rows={2}
              placeholder="Describe what changed in this version..."
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 leading-relaxed"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !title.trim()}
            className="rounded-xl text-xs font-bold bg-[#16A36A] hover:bg-[#118A58] text-white cursor-pointer"
          >
            {isSubmitting ? 'Saving Snapshot…' : 'Save Snapshot'}
          </Button>
        </form>
      ) : null}

      {/* Comparison View */}
      {comparison ? (
        <ResumeVersionDiff comparison={comparison} onClose={() => setComparison(null)} />
      ) : null}

      {/* Compare Selector controls */}
      {versions.length >= 2 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Compare Two Versions
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="compare-version-a" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                Version A (Base)
              </label>
              <select
                id="compare-version-a"
                value={selectedVersionA ?? ''}
                onChange={(e) => setSelectedVersionA(e.target.value || null)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-900"
              >
                <option value="">Select base version...</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} — {v.title} ({v.source}) {v.score !== null ? `Score: ${v.score}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="compare-version-b" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                Version B (Target)
              </label>
              <select
                id="compare-version-b"
                value={selectedVersionB ?? ''}
                onChange={(e) => setSelectedVersionB(e.target.value || null)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-900"
              >
                <option value="">Select target version...</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} — {v.title} ({v.source}) {v.score !== null ? `Score: ${v.score}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleCompare}
            disabled={!selectedVersionA || !selectedVersionB || selectedVersionA === selectedVersionB || isComparing}
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold cursor-pointer"
          >
            {isComparing ? 'Comparing...' : 'Compare Selected Versions'}
          </Button>
        </div>
      ) : null}

      {/* Version List */}
      {isLoading ? (
        <p className="text-xs text-slate-400 p-4 text-center">Loading versions...</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No version snapshots created yet.</p>
      ) : (
        <div className="space-y-3">
          {versions.map((v, idx) => {
            const isCurrent = v.isCurrent ?? (idx === 0);

            return (
              <div
                key={v.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-[#16A36A]/50 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-[#16A36A]/10 text-[#16A36A] px-2.5 py-0.5 text-xs font-black">
                      v{v.versionNumber}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {v.title}
                    </span>

                    {/* Source Origin Badge */}
                    {sourceBadge(v.source)}

                    {/* Current Indicator */}
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Current Active
                      </span>
                    )}

                    {v.score !== null ? (
                      <span
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1"
                        title="ATS score snapshot for this version"
                      >
                        (Score: {v.score})
                      </span>
                    ) : null}
                  </div>

                  {v.changesSummary ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-0.5">
                      {v.changesSummary}
                    </p>
                  ) : null}

                  <p className="text-[10px] text-slate-400 pl-0.5">
                    Created {new Date(v.createdAt).toLocaleDateString()} at{' '}
                    {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto pt-2 sm:pt-0">
                  {onOpenVersion && v.structuredData?.structuredResume && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenVersion(v)}
                      className="h-8 rounded-xl text-xs font-bold flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="Load this version's content into the editor"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Editor</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={restoringVersionId === v.id || isCurrent}
                    onClick={() => handleRestoreVersion(v.id)}
                    className="h-8 rounded-xl text-xs font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 disabled:opacity-40 cursor-pointer"
                    title={isCurrent ? 'This version is already active' : 'Restore this version as a new snapshot'}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{restoringVersionId === v.id ? 'Restoring…' : 'Restore'}</span>
                  </Button>

                  <button
                    onClick={() => handleDeleteVersion(v.id)}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
