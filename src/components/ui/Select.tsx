import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

export default function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-8 rounded-[var(--radius-sm)] border border-flow-border bg-flow-overlay/55 px-2 text-[11px] text-flow-text-secondary',
        'outline-none transition-colors focus:border-flow-border-focus focus:ring-2 focus:ring-flow-accent/30',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
