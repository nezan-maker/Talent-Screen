'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  getApiErrorMessage,
  getJob,
  isMockMode,
  runScreening,
} from '@/lib/api';

const steps = [
  'Parsing Profiles',
  'Scoring Candidates',
  'Ranking Results',
  'Generating Explanations',
] as const;

export default function ScreeningProgressPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? 'job_001';
  const totalSeconds = 5;
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(10);
  const [screeningError, setScreeningError] = useState<string>();
  const screeningStartedRef = useRef(false);
  const mockMode = isMockMode();
  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!mockMode) {
      return;
    }

    const timer = window.setInterval(
      () => setElapsed((current) => current + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [mockMode]);

  useEffect(() => {
    if (!mockMode || elapsed < totalSeconds) {
      return;
    }

    router.replace(`/dashboard/screening/${jobId}/results`);
  }, [elapsed, jobId, mockMode, router]);

  useEffect(() => {
    if (mockMode || !job || screeningStartedRef.current) {
      return;
    }

    screeningStartedRef.current = true;
    let isActive = true;
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 11));
    }, 900);

    void (async () => {
      try {
        await runScreening(jobId, job.title);
        if (!isActive) {
          return;
        }

        window.clearInterval(timer);
        setProgress(100);
        window.setTimeout(() => {
          router.replace(`/dashboard/screening/${jobId}/results`);
        }, 350);
      } catch (error) {
        if (!isActive) {
          return;
        }

        window.clearInterval(timer);
        setScreeningError(
          getApiErrorMessage(error, 'Unable to complete screening right now.')
        );
      }
    })();

    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, [job, jobId, mockMode, router]);

  const pct = mockMode
    ? Math.min(100, Math.round((elapsed / totalSeconds) * 100))
    : progress;
  const activeStepIdx = Math.min(
    steps.length - 1,
    Math.floor((pct / 100) * steps.length)
  );
  const remaining = mockMode
    ? Math.max(0, totalSeconds - elapsed)
    : Math.max(0, Math.ceil((100 - pct) / 11));
  const subtitle = useMemo(() => {
    if (job?.title) {
      return `Analyzing applicants for ${job.title}`;
    }

    if (jobLoading) {
      return 'Loading the job brief and screening context';
    }

    return 'Preparing the screening run';
  }, [job?.title, jobLoading]);

  if (!mockMode && (jobError || (!jobLoading && !job))) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary to-accent text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            We couldn&apos;t load this job
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">
            The screening run needs the job details first. Go back to the intake
            view and try again once the role is available.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => router.replace(`/dashboard/screening/${jobId}`)}
            >
              Back to Intake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!mockMode && screeningError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary to-accent text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Screening didn&apos;t finish
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">{screeningError}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button
              variant="outline"
              onClick={() => router.replace(`/dashboard/screening/${jobId}`)}
            >
              Back to Intake
            </Button>
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
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'linear' }}
          >
            <Brain className="h-10 w-10" />
          </motion.div>
        </motion.div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          AI is analyzing your candidates…
        </h1>
        <p className="mt-2 text-white/80">{subtitle}</p>

        <div className="mt-10 w-full rounded-card border border-white/15 bg-white/5 p-6">
          <div className="text-left text-sm font-semibold">Progress</div>
          <div className="mt-3">
            <ProgressBar value={pct} className="bg-white/15" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {steps.map((step, idx) => {
              const active = idx === activeStepIdx;
              const done = idx < activeStepIdx;

              return (
                <motion.div
                  key={step}
                  className={[
                    'rounded-card border px-4 py-3',
                    done
                      ? 'border-white/25 bg-white/10'
                      : active
                        ? 'border-white/35 bg-white/15'
                        : 'border-white/10 bg-white/5',
                  ].join(' ')}
                  animate={active ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={
                    active
                      ? { repeat: Infinity, duration: 1.2 }
                      : { duration: 0 }
                  }
                >
                  <div className="text-sm font-semibold">{step}</div>
                  <div className="mt-1 text-xs text-white/75">
                    {done ? 'Complete' : active ? 'In progress…' : 'Queued'}
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
