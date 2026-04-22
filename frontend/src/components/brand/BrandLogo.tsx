import { useId } from "react";
import { cn } from "@/lib/utils";

type BrandTone = "light" | "dark";
type BrandSize = "sm" | "md" | "lg";

const sizeClasses: Record<
  BrandSize,
  { mark: string; title: string; subtitle: string }
> = {
  sm: {
    mark: "h-9 w-9 rounded-[14px]",
    title: "text-sm",
    subtitle: "text-[11px]",
  },
  md: {
    mark: "h-10 w-10 rounded-[15px]",
    title: "text-base",
    subtitle: "text-xs",
  },
  lg: {
    mark: "h-12 w-12 rounded-[18px]",
    title: "text-lg",
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

export function BrandMarkSvg({
  className,
}: {
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const tileId = `${id}-tile`;
  const glowId = `${id}-glow`;
  const ringId = `${id}-ring`;
  const sweepId = `${id}-sweep`;
  const edgeId = `${id}-edge`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={tileId} x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#13253B" />
          <stop offset="0.55" stopColor="#0F172A" />
          <stop offset="1" stopColor="#08111C" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(46 14) rotate(139) scale(31 28)">
          <stop stopColor="#6EE7B7" stopOpacity="0.95" />
          <stop offset="1" stopColor="#6EE7B7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ringId} x1="12" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7F3D0" stopOpacity="0.25" />
          <stop offset="0.55" stopColor="#34D399" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ECFDF5" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={sweepId} x1="14" y1="24" x2="51" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#A7F3D0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F8FAFC" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={edgeId} x1="10" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86EFAC" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F8FAFC" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${tileId})`} />
      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${glowId})`} />
      <rect x="4.5" y="4.5" width="55" height="55" rx="17.5" stroke={`url(#${edgeId})`} />

      <circle cx="32" cy="33" r="18.5" stroke={`url(#${ringId})`} strokeWidth="2.5" />
      <path
        d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5"
        stroke={`url(#${sweepId})`}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5"
        stroke="#F8FAFC"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
      <path
        d="M29.5 15.7L31.2 17.5L34.7 13.6"
        stroke="#052E26"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 47H45"
        stroke="#DCFCE7"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandMark({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.26)] ring-1 ring-white/10",
        className,
      )}
    >
      <BrandMarkSvg className="h-full w-full" />
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
    <div className={cn("inline-flex items-center gap-3", className)}>
      <BrandMark className={styles.mark} />
      {showWordmark ? (
        <div className="min-w-0 leading-none">
          <div className={cn("font-extrabold tracking-tight", styles.title, toneStyle.title)}>WiseRank</div>
          {subtitle ? (
            <div className={cn("mt-1 font-medium", styles.subtitle, toneStyle.subtitle)}>{subtitle}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
