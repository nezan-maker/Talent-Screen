import { useId } from "react";
import { cn } from "@/lib/utils";

type BrandTone = "light" | "dark";
type BrandSize = "sm" | "md" | "lg";

const sizeClasses: Record<
  BrandSize,
  { mark: string; title: string; subtitle: string }
> = {
  sm: {
    mark: "h-9 w-9 rounded-xl",
    title: "text-lg",
    subtitle: "text-[11px]",
  },
  md: {
    mark: "h-10 w-10 rounded-xl",
    title: "text-xl",
    subtitle: "text-xs",
  },
  lg: {
    mark: "h-12 w-12 rounded-2xl",
    title: "text-2xl",
    subtitle: "text-sm",
  },
};

const toneClasses: Record<
  BrandTone,
  { title: string; subtitle: string }
> = {
  light: {
    title: "text-text-primary",
    subtitle: "text-text-muted",
  },
  dark: {
    title: "text-white",
    subtitle: "text-white/60",
  },
};

function TalvoGlyph({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const eyeGradientId = `talvo-eye-${id}`;
  const petalColor = "#FF6A00";

  return (
    <svg viewBox="0 0 72 72" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <radialGradient id={eyeGradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7A17" />
          <stop offset="100%" stopColor={petalColor} />
        </radialGradient>
      </defs>

      <g fill={petalColor}>
        <circle cx="36" cy="14" r="12.75" />
        <circle cx="36" cy="58" r="12.75" />
        <circle cx="20" cy="24.25" r="12.75" />
        <circle cx="52" cy="24.25" r="12.75" />
        <circle cx="20" cy="47.75" r="12.75" />
        <circle cx="52" cy="47.75" r="12.75" />
      </g>

      <path
        fill="#FFFFFF"
        d="M12 36c7.5-7.25 15.5-10.88 24-10.88S52.5 28.75 60 36c-7.5 7.25-15.5 10.88-24 10.88S19.5 43.25 12 36Z"
      />
      <circle cx="36" cy="36" r="8.2" fill={`url(#${eyeGradientId})`} />
    </svg>
  );
}

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: BrandSize;
}) {
  const styles = sizeClasses[size];
  
  return (
    <div
      className={cn(
        "relative overflow-hidden shadow-sm flex items-center justify-center",
        styles.mark,
        className,
      )}
    >
      <TalvoGlyph />
    </div>
  );
}

export function BrandLogo({
  className,
  size = "md",
  tone = "light",
  subtitle,
  showWordmark = true,
}: {
  className?: string;
  size?: BrandSize;
  tone?: BrandTone;
  subtitle?: string;
  showWordmark?: boolean;
}) {
  const styles = sizeClasses[size];
  const toneStyle = toneClasses[tone];

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {showWordmark ? (
        <div className="min-w-0 leading-none">
          <div className={cn("font-bold tracking-[-0.04em]", styles.title, toneStyle.title)}>
            Talvo
          </div>
          {subtitle ? (
            <div className={cn("mt-1 font-medium", styles.subtitle, toneStyle.subtitle)}>{subtitle}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
