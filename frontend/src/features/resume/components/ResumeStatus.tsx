import { cn } from '@/lib/utils';
import type { ResumeProcessingStatus } from '@/features/resume/types/resume';
import { getResumeStatusLabel, getResumeStatusTone } from '@/features/resume/utils/status';

interface ResumeStatusProps {
  status: ResumeProcessingStatus;
  className?: string;
}

export function ResumeStatus({ status, className }: ResumeStatusProps) {
  const tone = getResumeStatusTone(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'success' && 'bg-green-100 text-green-800',
        tone === 'error' && 'bg-red-100 text-red-800',
        tone === 'info' && 'bg-blue-100 text-blue-800',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {getResumeStatusLabel(status)}
    </span>
  );
}
