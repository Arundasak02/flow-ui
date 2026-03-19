import type { InputHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-[var(--radius-md)] border border-flow-border bg-flow-overlay/45 px-3 text-[13px] text-flow-text',
        'placeholder:text-flow-text-muted outline-none transition-colors',
        'focus:border-flow-border-focus focus:ring-2 focus:ring-flow-accent/35',
        className
      )}
      {...props}
    />
  );
}
