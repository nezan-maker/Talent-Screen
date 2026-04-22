"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

const goals = [
  { label: "Engineering hires (Q1)", current: 7, target: 10 },
  { label: "Design roles filled", current: 2, target: 4 },
  { label: "Screenings completed", current: 156, target: 200 },
];

export function ScreeningTargetsCard() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-text-primary">Hiring & screening targets</h3>
      <p className="text-sm text-text-muted">Progress toward team goals</p>
      <ul className="mt-4 space-y-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <li key={g.label}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-text-primary">{g.label}</span>
                <span className="shrink-0 text-text-muted">
                  <span className="font-semibold text-text-primary">{g.current}</span>
                  <span> / {g.target}</span>
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={pct} className="bg-border/50" barClassName="bg-success" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
