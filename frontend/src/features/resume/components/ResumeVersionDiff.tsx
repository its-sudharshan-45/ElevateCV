import type { ResumeVersionComparison } from '../api/resume-version.api';

interface ResumeVersionDiffProps {
  comparison: ResumeVersionComparison;
  onClose: () => void;
}

export function ResumeVersionDiff({ comparison, onClose }: ResumeVersionDiffProps) {
  const { versionA, versionB, scoreDelta, skillDiff } = comparison;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold">Version Comparison</h4>
          <p className="text-xs text-muted-foreground">
            Comparing v{versionA.versionNumber} ({versionA.title}) with v{versionB.versionNumber} ({versionB.title})
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Close Comparison
        </button>
      </div>

      {/* Score Delta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">v{versionA.versionNumber} Score</p>
          <p className="text-2xl font-bold">{versionA.score ?? 'N/A'}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">v{versionB.versionNumber} Score</p>
          <p className="text-2xl font-bold">{versionB.score ?? 'N/A'}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">Score Delta</p>
          {scoreDelta !== null ? (
            <p
              className={`text-2xl font-bold ${
                scoreDelta > 0
                  ? 'text-green-600'
                  : scoreDelta < 0
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              }`}
            >
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
            </p>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">N/A</p>
          )}
        </div>
      </div>

      {/* Skill Diff */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold">Skill Changes</h5>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-green-500/5 p-3">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
              Added in v{versionB.versionNumber} ({skillDiff.added.length})
            </p>
            {skillDiff.added.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillDiff.added.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No new skills added</p>
            )}
          </div>

          <div className="rounded-lg border bg-red-500/5 p-3">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
              Removed in v{versionB.versionNumber} ({skillDiff.removed.length})
            </p>
            {skillDiff.removed.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillDiff.removed.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300"
                  >
                    - {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No skills removed</p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Unchanged ({skillDiff.unchanged.length})
            </p>
            {skillDiff.unchanged.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillDiff.unchanged.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No common skills</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
