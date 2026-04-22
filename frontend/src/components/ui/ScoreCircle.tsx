import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn, clamp } from "@/lib/utils";
import { SCORE_THRESHOLDS } from "@/lib/constants";

function scoreColor(score: number) {
  if (score >= SCORE_THRESHOLDS.qualifiedMin) return "text-success";
  if (score >= SCORE_THRESHOLDS.maybeMin) return "text-warning";
  return "text-danger";
}

export function ScoreCircle({
  score,
  size = 74,
  className,
  label = "AI Score",
}: {
  score: number;
  size?: number;
  className?: string;
  label?: string;
}) {
  const s = clamp(Math.round(score), 0, 100);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const progress = useSpring(0, { stiffness: 120, damping: 20 });
  const dashoffset = useTransform(progress, (p) => c - (p / 100) * c);

  useEffect(() => {
    progress.set(s);
  }, [progress, s]);

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            className="stroke-border/70"
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            className={cn("stroke-current", scoreColor(s))}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={c}
            style={{ strokeDashoffset: dashoffset }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("text-xl font-bold leading-none", scoreColor(s))}>{s}</div>
        </div>
      </div>
      <div className="mt-2 text-xs font-medium text-text-muted">{label}</div>
    </div>
  );
}

