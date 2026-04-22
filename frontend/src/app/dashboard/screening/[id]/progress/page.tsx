"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { isMockMode } from "@/lib/api";

const steps = ["Parsing Profiles", "Scoring Candidates", "Ranking Results", "Generating Explanations"] as const;

export default function ScreeningProgressPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? "job_001";
  const totalSeconds = 5;
  const [elapsed, setElapsed] = useState(0);
  const mockMode = isMockMode();

  useEffect(() => {
    if (!mockMode) {
      return;
    }

    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [mockMode]);

  useEffect(() => {
    if (!mockMode) {
      return;
    }

    if (elapsed >= totalSeconds) {
      window.location.href = `/dashboard/screening/${jobId}/results`;
    }
  }, [elapsed, jobId, mockMode]);

  const pct = Math.min(100, Math.round((elapsed / totalSeconds) * 100));
  const activeStepIdx = Math.min(steps.length - 1, Math.floor((pct / 100) * steps.length));
  const remaining = Math.max(0, totalSeconds - elapsed);

  const subtitle = useMemo(() => `Reviewing 87 applicants against job criteria`, []);

  if (!mockMode) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary to-accent text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <Brain className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Backend scoring is not connected yet</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Candidate intake is real now, but the backend does not expose a screening-run endpoint yet. Once that
            route exists, this progress view can track a live analysis run instead of a simulated one.
          </p>
          <div className="mt-6">
            <Button onClick={() => (window.location.href = `/dashboard/screening/${jobId}`)}>Back to Intake</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary to-accent text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "linear" }}
          >
            <Brain className="h-10 w-10" />
          </motion.div>
        </motion.div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">AI is analyzing your candidates…</h1>
        <p className="mt-2 text-white/80">{subtitle}</p>

        <div className="mt-10 w-full rounded-card border border-white/15 bg-white/5 p-6">
          <div className="text-left text-sm font-semibold">Progress</div>
          <div className="mt-3">
            <ProgressBar value={pct} className="bg-white/15" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {steps.map((s, idx) => {
              const active = idx === activeStepIdx;
              const done = idx < activeStepIdx;
              return (
                <motion.div
                  key={s}
                  className={[
                    "rounded-card border px-4 py-3",
                    done ? "border-white/25 bg-white/10" : active ? "border-white/35 bg-white/15" : "border-white/10 bg-white/5",
                  ].join(" ")}
                  animate={active ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={active ? { repeat: Infinity, duration: 1.2 } : { duration: 0 }}
                >
                  <div className="text-sm font-semibold">{s}</div>
                  <div className="mt-1 text-xs text-white/75">
                    {done ? "Complete" : active ? "In progress…" : "Queued"}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-white/80">
            <div>Estimated time remaining</div>
            <div className="font-semibold">{remaining}s</div>
          </div>
        </div>
      </div>
    </div>
  );
}
