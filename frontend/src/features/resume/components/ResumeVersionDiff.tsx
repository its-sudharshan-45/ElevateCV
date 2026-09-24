import type { ResumeVersionComparison } from '../api/resume-version.api';
import { Tag, FileText, Briefcase, FolderGit2, GraduationCap, Award, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeVersionDiffProps {
  comparison: ResumeVersionComparison;
  onClose: () => void;
}

export function ResumeVersionDiff({ comparison, onClose }: ResumeVersionDiffProps) {
  const { versionA, versionB, scoreDelta, skillDiff, sectionDiff } = comparison;

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            Version Comparison
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparing <strong>v{versionA.versionNumber} ({versionA.title})</strong> with{' '}
            <strong>v{versionB.versionNumber} ({versionB.title})</strong>
          </p>
        </div>
        <Button
          onClick={onClose}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close Comparison</span>
        </Button>
      </div>

      {/* Overview Note */}
      {sectionDiff?.overview && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <Info className="w-4 h-4 text-[#16A36A] flex-shrink-0 mt-0.5" />
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Change Summary:</strong> {sectionDiff.overview}
          </p>
        </div>
      )}

      {/* Score Delta */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center bg-slate-50/50 dark:bg-slate-800/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            v{versionA.versionNumber} ATS Score
          </p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {versionA.score !== null ? `${versionA.score}/100` : 'N/A'}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">{versionA.source}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center bg-slate-50/50 dark:bg-slate-800/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            v{versionB.versionNumber} ATS Score
          </p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {versionB.score !== null ? `${versionB.score}/100` : 'N/A'}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">{versionB.source}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center bg-slate-50/50 dark:bg-slate-800/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score Delta</p>
          {scoreDelta !== null ? (
            <p
              className={`text-2xl font-black mt-1 ${
                scoreDelta > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : scoreDelta < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500'
              }`}
            >
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
            </p>
          ) : (
            <p className="text-2xl font-black text-slate-400 mt-1">N/A</p>
          )}
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {scoreDelta !== null ? 'ATS point difference' : 'Not re-analyzed'}
          </span>
        </div>
      </div>

      {/* Summary Diff */}
      {sectionDiff?.summary?.isModified && (
        <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-[#16A36A]" /> Professional Summary Changes
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30">
              <span className="text-[10px] font-bold uppercase text-rose-700 block mb-1">
                v{versionA.versionNumber} Summary
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {sectionDiff.summary.versionA || '(empty)'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                v{versionB.versionNumber} Summary
              </span>
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                {sectionDiff.summary.versionB || '(empty)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Diff */}
      <div className="space-y-3">
        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5 text-[#16A36A]" /> Skill Changes
        </h5>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 space-y-2">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Added in v{versionB.versionNumber} ({skillDiff.added.length})
            </p>
            {skillDiff.added.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillDiff.added.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No new skills added</p>
            )}
          </div>

          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 p-3.5 space-y-2">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
              Removed in v{versionB.versionNumber} ({skillDiff.removed.length})
            </p>
            {skillDiff.removed.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillDiff.removed.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-xl bg-rose-100 dark:bg-rose-900/40 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    - {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No skills removed</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-3.5 space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Unchanged ({skillDiff.unchanged.length})
            </p>
            {skillDiff.unchanged.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillDiff.unchanged.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No common skills</p>
            )}
          </div>
        </div>
      </div>

      {/* Experience Diff */}
      {sectionDiff?.experience && (sectionDiff.experience.added.length > 0 || sectionDiff.experience.removed.length > 0 || sectionDiff.experience.modified.length > 0) && (
        <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 text-xs">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5 text-[#16A36A]" /> Work Experience Changes
          </h5>
          <div className="flex flex-wrap gap-3">
            {sectionDiff.experience.added.map((name) => (
              <span key={name} className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-semibold">
                + Added Role: {name}
              </span>
            ))}
            {sectionDiff.experience.removed.map((name) => (
              <span key={name} className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-semibold">
                - Removed Role: {name}
              </span>
            ))}
            {sectionDiff.experience.modified.map((item) => (
              <span key={item.name} className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-semibold">
                • Modified Role: {item.name} ({item.details})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects Diff */}
      {sectionDiff?.projects && (sectionDiff.projects.added.length > 0 || sectionDiff.projects.removed.length > 0 || sectionDiff.projects.modified.length > 0) && (
        <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 text-xs">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
            <FolderGit2 className="w-3.5 h-3.5 text-[#16A36A]" /> Project Changes
          </h5>
          <div className="flex flex-wrap gap-3">
            {sectionDiff.projects.added.map((name) => (
              <span key={name} className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-semibold">
                + Added Project: {name}
              </span>
            ))}
            {sectionDiff.projects.removed.map((name) => (
              <span key={name} className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-semibold">
                - Removed Project: {name}
              </span>
            ))}
            {sectionDiff.projects.modified.map((item) => (
              <span key={item.name} className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-semibold">
                • Modified Project: {item.name} ({item.details})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
