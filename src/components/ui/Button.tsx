import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'border-flow-accent/60 bg-flow-accent/18 text-flow-text hover:bg-flow-accent/28 hover:border-flow-accent',
  secondary:
    'border-flow-border bg-flow-overlay/55 text-flow-text-secondary hover:bg-flow-hover hover:text-flow-text',
  ghost: 'border-transparent bg-transparent text-flow-text-secondary hover:bg-flow-hover hover:text-flow-text',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[12px]',
  md: 'h-10 px-3 text-[13px]',
  lg: 'h-11 px-3.5 text-sm',
};

export default function Button({
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border transition-colors font-medium outline-none',
        'focus-visible:border-flow-border-focus focus-visible:ring-2 focus-visible:ring-flow-accent/35',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  );
}
