import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
}: {
  className?: string;
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
}) {
  const v =
    variant === "success"
      ? "bg-success/10 text-success border-success/20"
      : variant === "warning"
        ? "bg-warning/10 text-warning border-warning/20"
        : variant === "danger"
          ? "bg-danger/10 text-danger border-danger/20"
          : variant === "info"
            ? "bg-accent/10 text-accent border-accent/20"
            : "bg-surface text-text-muted border-border shadow-sm";

  const dotColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-accent",
    default: "bg-text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide",
        v,
        className,
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

