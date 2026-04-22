import { cn } from "@/lib/utils";

export function SkillTag({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge border border-border bg-bg px-3 py-1 text-xs font-semibold text-text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

