import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-input bg-border/60", className)} aria-hidden="true" />
  );
}

  