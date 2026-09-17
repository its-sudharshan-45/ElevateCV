
import { FileText, Trash2, Eye, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeStatus } from '@/features/resume/components/ResumeStatus';
import type { ResumeListItem } from '@/features/resume/types/resume';
import { formatFileSize } from '@/features/resume/utils/status';

interface ResumeCardProps {
  resume: ResumeListItem;
  selected: boolean;
  onSelect: (resumeId: string) => void;
  onDelete: (resumeId: string) => void;
  isDeleting: boolean;
}

export function ResumeCard({
  resume,
  selected,
  onSelect,
  onDelete,
  isDeleting,
}: ResumeCardProps) {
  const formattedDate = new Date(resume.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 ${
        selected
          ? 'border-[#007A5A] bg-[#007A5A]/5 dark:bg-[#007A5A]/15 shadow-sm ring-2 ring-[#007A5A]/20'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="w-11 h-11 rounded-2xl bg-[#007A5A]/10 text-[#007A5A] dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div className="truncate">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
              <span>{resume.originalFilename}</span>
              {selected && (
                <span className="px-2 py-0.5 rounded-full bg-[#007A5A] text-white text-[10px] font-extrabold">
                  Active
                </span>
              )}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formatFileSize(resume.fileSize)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="flex items-center gap-2 sm:gap-3">
            <ResumeStatus status={resume.processingStatus} />
            {typeof resume.score === 'number' && (
              <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#007A5A]" />
                <span>Match Score: {resume.score}</span>
              </div>
            )}

          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={selected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelect(resume.id)}
              className={
                selected
                  ? 'bg-[#007A5A] hover:bg-[#006349] text-white font-bold text-xs rounded-xl shadow-xs'
                  : 'text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 hover:border-[#007A5A] hover:text-[#007A5A]'
              }
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              View Analysis
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(resume.id)}
              disabled={isDeleting}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
              title="Delete resume"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
