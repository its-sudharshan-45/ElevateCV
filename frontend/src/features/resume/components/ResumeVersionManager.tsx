
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { ApiClientError } from '@/lib/api/client';
import {
  compareResumeVersions,
  createResumeVersion,
  deleteResumeVersion,
  listResumeVersions,
  type ResumeVersion,
  type ResumeVersionComparison,
} from '../api/resume-version.api';
import { ResumeVersionDiff } from './ResumeVersionDiff';

interface ResumeVersionManagerProps {
  resumeId: string;
  processingStatus: string;
}

export function ResumeVersionManager({
  resumeId,
  processingStatus,
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

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listResumeVersions(resumeId);
      setVersions(data.versions);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to load resume versions.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

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
      setVersions((prev) => [data.version, ...prev]);
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
    if (!window.confirm('Delete this version snapshot?')) return;

    setError(null);
    try {
      await deleteResumeVersion(resumeId, versionId);
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
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
    <section aria-labelledby="resume-versions-heading" className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="resume-versions-heading" className="text-lg font-semibold">
            Version Snapshots ({versions.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Save immutable snapshots of your resume data to track improvements over time.
          </p>
        </div>
        {isProcessed ? (
          <Button
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? 'outline' : 'default'}
            size="sm"
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
        <p className="text-xs text-green-700 font-medium">{successMessage}</p>
      ) : null}

      {/* Create Version Form */}
      {isCreating ? (
        <form onSubmit={handleCreateVersion} className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <h4 className="text-sm font-semibold">New Version Snapshot</h4>
          <div className="space-y-2">
            <label htmlFor="version-title" className="text-xs font-medium">
              Version Title *
            </label>
            <input
              id="version-title"
              type="text"
              required
              placeholder="e.g., Updated with React Native experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border px-3 py-1.5 text-sm bg-background"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="version-summary" className="text-xs font-medium">
              Changes Summary (optional)
            </label>
            <textarea
              id="version-summary"
              rows={2}
              placeholder="Describe what changed in this version..."
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              className="w-full rounded-md border px-3 py-1.5 text-sm bg-background"
            />
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting || !title.trim()}>
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
        <div className="rounded-lg border p-4 bg-muted/10 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Compare Two Snapshots
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="compare-version-a" className="text-xs text-muted-foreground block mb-1">
                Version A (Base)
              </label>
              <select
                id="compare-version-a"
                value={selectedVersionA ?? ''}
                onChange={(e) => setSelectedVersionA(e.target.value || null)}
                className="w-full rounded-md border px-2 py-1.5 text-xs bg-background"
              >
                <option value="">Select version...</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} — {v.title} (Score: {v.score ?? 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="compare-version-b" className="text-xs text-muted-foreground block mb-1">
                Version B (Target)
              </label>
              <select
                id="compare-version-b"
                value={selectedVersionB ?? ''}
                onChange={(e) => setSelectedVersionB(e.target.value || null)}
                className="w-full rounded-md border px-2 py-1.5 text-xs bg-background"
              >
                <option value="">Select version...</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} — {v.title} (Score: {v.score ?? 'N/A'})
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
          >
            {isComparing ? 'Comparing...' : 'Compare Selected'}
          </Button>
        </div>
      ) : null}

      {/* Version List */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading versions...</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No version snapshots created yet.</p>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/10 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    v{v.versionNumber}
                  </span>
                  <span className="text-sm font-medium">{v.title}</span>
                  {v.score !== null ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      (Score: {v.score})
                    </span>
                  ) : null}
                </div>
                {v.changesSummary ? (
                  <p className="mt-1 text-xs text-muted-foreground">{v.changesSummary}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Created {new Date(v.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => handleDeleteVersion(v.id)}
                type="button"
                className="text-xs text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
