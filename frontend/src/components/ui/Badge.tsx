import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: BadgeVariant;
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
            : "bg-bg text-text-muted border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge border px-3 py-1 text-xs font-semibold",
        v,
        className,
      )}
    >
      {children}
    </span>
  );
}

