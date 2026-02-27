import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary border-border-subtle',
    success: 'bg-accent-success/20 text-accent-success border-accent-success/30',
    warning: 'bg-accent-warning/20 text-accent-warning border-accent-warning/30',
    error: 'bg-accent-error/20 text-accent-error border-accent-error/30',
    info: 'bg-accent-info/20 text-accent-info border-accent-info/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
