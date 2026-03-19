import { cn } from '@/components/ui/cn';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-linear-to-r from-flow-overlay/70 via-flow-hover/80 to-flow-overlay/70',
        className
      )}
    />
  );
}
