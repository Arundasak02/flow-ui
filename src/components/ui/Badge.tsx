import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

type BadgeVariant = 'neutral' | 'success' | 'error' | 'warning' | 'info';

const variantClass: Record<BadgeVariant, string> = {
  neutral: 'border-flow-border text-flow-text-secondary bg-flow-overlay/50',
  success: 'border-flow-success/40 text-flow-success bg-flow-success-muted',
  error: 'border-flow-error/40 text-flow-error bg-flow-error-muted',
  warning: 'border-flow-warning/40 text-flow-warning bg-flow-warning-muted',
  info: 'border-flow-state-info/40 text-flow-state-info bg-flow-state-info-muted',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-pill)] border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
