import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  title,
  subtitle,
  right,
  icon: Icon,
}: {
  className?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-6 border-b border-border/50", className)}>
      <div className="min-w-0 flex items-start gap-4">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-input bg-accent/10 flex-shrink-0 mt-1">
            <Icon className="h-5 w-5 text-accent" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-text-primary">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-text-muted">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

