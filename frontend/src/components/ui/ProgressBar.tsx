import { cn, clamp } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = clamp(value, 0, 100);
  return (
    <div className={cn("h-2 w-full rounded-full bg-border/60", className)}>
      <div className={cn("h-2 rounded-full bg-accent", barClassName)} style={{ width: `${v}%` }} />
    </div>
  );
}

