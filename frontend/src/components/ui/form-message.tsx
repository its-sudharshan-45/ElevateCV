import { cn } from '@/lib/utils';

interface FormMessageProps {
  id?: string;
  message?: string;
  className?: string;
}

export function FormMessage({ id, message, className }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className={cn('text-sm text-destructive', className)}>
      {message}
    </p>
  );
}
