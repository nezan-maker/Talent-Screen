'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Brain, CheckCircle2, CircleDot } from 'lucide-react';
import { ScreeningProgressSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  getAiLimitResetDetails,
  getApiErrorMessage,
  getJob,
  getScreeningRuns,
  isMockMode,
  runScreening,
  type ScreeningRunSummary,
} from '@/lib/api';

const MOCK_TOTAL_SECONDS = 6;
const SCREEN_WINDOW_MIN_HEIGHT_CLASS = 'min-h-[480px] md:min-h-[540px]';
const SCREEN_WINDOW_MAX_WIDTH_CLASS = 'max-w-4xl';

const stages = [
  {
    title: 'Scoring Candidates',
    description: 'Evaluating fit against job criteria and core requirements.',
  },
  {
    title: 'Ranking Results',
    description: 'Ordering candidates by score and shortlist confidence.',
  },
  {
    title: 'Generating Explanations',
    description: 'Preparing recruiter-friendly reasoning and recommendations.',
  },
  {
    title: 'Finalizing Results',
    description: 'Saving the run output and preparing recruiter review.',
  },
] as const;

type ScreeningSummary = {
  screenedCount: number;
  verdict: string;
};

function runTimestampMs(run: ScreeningRunSummary | null | undefined) {
  if (!run) {
    return 0;
  }

  const source = run.started_at || run.createdAt || '';
  const parsed = Date.parse(source);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ScreeningProgressPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? 'job_001';
  const mockMode = isMockMode();
  const sessionStartedAtRef = useRef(Date.now());
  const screeningStartedRef = useRef(false);

  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(8);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [screeningError, setScreeningError] = useState<string>();
  const [screeningNotice, setScreeningNotice] = useState<string | null>(null);
  const [screeningComplete, setScreeningComplete] = useState(false);
  const [summary, setSummary] = useState<ScreeningSummary | null>(null);

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

  const {
    data: screeningRuns = [],
    isFetched: screeningRunsFetched,
  } = useQuery({
    queryKey: ['screeningRuns', jobId],
    queryFn: () => getScreeningRuns(jobId),
    enabled: Boolean(jobId) && !mockMode && Boolean(job),
    retry: 1,
    refetchInterval:
      mockMode || screeningComplete || Boolean(screeningError) ? false : 2500,
    staleTime: 3_000,
  });

  const latestRun = screeningRuns[0];
  const trackedRun = useMemo(() => {
    if (activeRunId) {
      return (
        screeningRuns.find((run) => run._id === activeRunId) ??
        latestRun ??
        null
      );
    }

    return latestRun ?? null;
  }, [activeRunId, latestRun, screeningRuns]);

  useEffect(() => {
    if (screeningComplete || Boolean(screeningError)) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screeningComplete, screeningError]);

  useEffect(() => {
    if (!mockMode || screeningComplete || elapsed < MOCK_TOTAL_SECONDS) {
      return;
    }

    setProgress(100);
    setSummary({
      screenedCount: job?.applicantsCount ?? 0,
      verdict: 'Screening completed successfully',
    });
    setScreeningComplete(true);
  }, [elapsed, job?.applicantsCount, mockMode, screeningComplete]);

  useEffect(() => {
    if (
      mockMode ||
      !job ||
      jobLoading ||
      !screeningRunsFetched ||
      screeningComplete ||
      Boolean(screeningError) ||
      screeningStartedRef.current
    ) {
      return;
    }

    screeningStartedRef.current = true;
    let isActive = true;

    if (latestRun?.status === 'running') {
      setActiveRunId(latestRun._id);
      setProgress((current) => Math.max(current, 20));
      return () => {
        isActive = false;
      };
    }

    void (async () => {
      try {
        setProgress((current) => Math.max(current, 15));

        const result = await runScreening(jobId, job.title);
        if (!isActive) {
          return;
        }

        setProgress(100);
        setSummary({
          screenedCount: result.applicants.length,
          verdict: result.verdict,
        });
        setScreeningComplete(true);
        setScreeningNotice(null);

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['latestScreeningResults', jobId],
          }),
          queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] }),
          queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
          queryClient.invalidateQueries({ queryKey: ['candidates'] }),
          queryClient.invalidateQueries({ queryKey: ['screeningRuns', jobId] }),
        ]);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const aiLimitReset = getAiLimitResetDetails(error);
        if (aiLimitReset) {
          setScreeningError(
            `Gemini usage is temporarily limited. The limit resets at ${aiLimitReset.resetAtLabel} (${aiLimitReset.remainingLabel} remaining).`
          );
          return;
        }

        const message = getApiErrorMessage(
          error,
          'Unable to complete screening right now.'
        );

        if (message.toLowerCase().includes('timeout')) {
          setScreeningNotice(
            'Screening is taking longer than expected, but it may still be running. This page will update automatically.'
          );
          return;
        }

        setScreeningError(message);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    job,
    jobId,
    jobLoading,
    latestRun,
    mockMode,
    queryClient,
    screeningComplete,
    screeningError,
    screeningRunsFetched,
  ]);

  useEffect(() => {
    if (
      mockMode ||
      screeningComplete ||
      Boolean(screeningError) ||
      !screeningStartedRef.current
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((current) => {
        const runStatus = trackedRun?.status;
        const increment =
          runStatus === 'running' ? 2.4 : runStatus === 'queued' ? 1.2 : 0.9;
        const ceiling =
          runStatus === 'running' ? 94 : runStatus === 'queued' ? 40 : 24;

        return Math.min(ceiling, current + increment);
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mockMode, screeningComplete, screeningError, trackedRun?.status]);

  useEffect(() => {
    if (
      mockMode ||
      !trackedRun ||
      !screeningStartedRef.current ||
      screeningComplete ||
      Boolean(screeningError)
    ) {
      return;
    }

    const isCurrentRun =
      trackedRun.status === 'running' ||
      runTimestampMs(trackedRun) >= sessionStartedAtRef.current - 5_000;

    if (!activeRunId) {
      if (!isCurrentRun) {
        return;
      }

      setActiveRunId(trackedRun._id);
    } else if (trackedRun._id !== activeRunId) {
      return;
    }

    if (trackedRun.status === 'running') {
      setProgress((current) => Math.max(current, 28));
      setScreeningNotice(null);
      return;
    }

    if (trackedRun.status === 'failed') {
      setScreeningError(
        trackedRun.error?.trim() || 'Screening failed before completion.'
      );
      return;
    }

    if (trackedRun.status === 'completed') {
      setProgress(100);
      setSummary((current) => {
        if (current) {
          return current;
        }

        return {
          screenedCount: trackedRun.result_count ?? 0,
          verdict: 'Screening completed successfully',
        };
      });
      setScreeningComplete(true);
      setScreeningNotice(null);

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['latestScreeningResults', jobId],
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] }),
      ]);
    }
  }, [
    activeRunId,
    jobId,
    mockMode,
    queryClient,
    screeningComplete,
    screeningError,
    trackedRun,
  ]);

  const pct = screeningComplete
    ? 100
    : mockMode
      ? Math.min(100, Math.round((elapsed / MOCK_TOTAL_SECONDS) * 100))
      : Math.max(8, Math.round(progress));

  const activeStageIdx = screeningComplete
    ? stages.length - 1
    : Math.min(stages.length - 1, Math.floor((pct / 100) * stages.length));

  const remaining = screeningComplete
    ? 0
    : mockMode
      ? Math.max(0, MOCK_TOTAL_SECONDS - elapsed)
      : Math.max(4, Math.ceil((100 - pct) / 2));

  const subtitle = useMemo(() => {
    if (screeningComplete) {
      return 'Screening run completed and stored successfully.';
    }

    if (trackedRun?.status === 'queued') {
      return 'Screening run is queued and waiting for execution.';
    }

    if (trackedRun?.status === 'running') {
      return 'Evaluating profile quality, fit, and recommendation confidence.';
    }

    if (job?.title) {
      return `Analyzing applicants for ${job.title}`;
    }

    if (jobLoading) {
      return 'Loading the job brief and screening context';
    }

    return 'Preparing the screening run';
  }, [job?.title, jobLoading, screeningComplete, trackedRun?.status]);

  const liveStatus = screeningComplete
    ? 'completed'
    : trackedRun?.status || (screeningStartedRef.current ? 'running' : 'queued');

  const statusLabel =
    liveStatus === 'completed'
      ? 'Completed'
      : liveStatus === 'failed'
        ? 'Failed'
        : liveStatus === 'running'
          ? 'Running'
          : 'Queued';

  if (jobLoading) {
    return <ScreeningProgressSkeleton />;
  }

  if (!mockMode && (jobError || (!jobLoading && !job))) {
    return (
      <div className="px-2 py-4 md:px-4 md:py-6">
        <div
          className={`mx-auto w-full ${SCREEN_WINDOW_MAX_WIDTH_CLASS} overflow-hidden rounded-[28px] bg-linear-to-br from-primary to-accent text-white shadow-card ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
        >
          <div
            className={`mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-12 text-center ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
          >
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
              <Button onClick={() => router.replace(`/dashboard/screening/${jobId}`)}>
                Back to Intake
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mockMode && screeningError) {
    return (
      <div className="px-2 py-4 md:px-4 md:py-6">
        <div
          className={`mx-auto w-full ${SCREEN_WINDOW_MAX_WIDTH_CLASS} overflow-hidden rounded-[28px] bg-linear-to-br from-primary to-accent text-white shadow-card ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
        >
          <div
            className={`mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-12 text-center ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
          >
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
      </div>
    );
  }

  if (screeningComplete) {
    return (
      <div className="px-2 py-4 md:px-4 md:py-6">
        <div
          className={`mx-auto w-full ${SCREEN_WINDOW_MAX_WIDTH_CLASS} overflow-hidden rounded-[28px] bg-linear-to-br from-primary to-accent text-white shadow-card ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
        >
          <div
            className={`mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-10 text-center ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
          >
            <div className="w-full rounded-card border border-white/15 bg-white/6 px-6 py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                Screening complete
              </h1>
              <p className="mt-2 text-white/80">
                AI screening has finished. Results are now saved in the database and
                ready for review.
              </p>
              {summary ? (
                <p className="mt-2 text-sm text-white/80">
                  {summary.screenedCount} candidate
                  {summary.screenedCount === 1 ? '' : 's'} screened. {summary.verdict}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href={`/dashboard/screening/${jobId}/results`} className="block">
                  <Button>Show screening results</Button>
                </Link>
                <Link href={`/dashboard/screening/${jobId}`} className="block">
                  <Button variant="outline">Back to Intake</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-4 md:px-4 md:py-6">
      <div
        className={`mx-auto w-full ${SCREEN_WINDOW_MAX_WIDTH_CLASS} overflow-hidden rounded-[28px] bg-linear-to-br from-primary to-accent text-white shadow-card ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
      >
        <div
          className={`mx-auto flex max-w-3xl flex-col items-center justify-center px-5 py-10 text-center ${SCREEN_WINDOW_MIN_HEIGHT_CLASS}`}
        >
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.6, ease: 'linear' }}
            >
              <Brain className="h-8 w-8" />
            </motion.div>
          </motion.div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            AI screening is in progress
          </h1>
          <p className="mt-2 max-w-2xl text-white/85">{subtitle}</p>

          <div className="mt-6 w-full rounded-card border border-white/15 bg-white/5 p-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold">Live Progress</div>
              <div
                className={[
                  'rounded-badge border px-3 py-1 text-xs font-semibold',
                  liveStatus === 'completed'
                    ? 'border-emerald-200/40 bg-emerald-300/20 text-emerald-100'
                    : liveStatus === 'failed'
                      ? 'border-rose-200/40 bg-rose-300/20 text-rose-100'
                      : liveStatus === 'running'
                        ? 'border-white/35 bg-white/15 text-white'
                        : 'border-white/20 bg-white/10 text-white/85',
                ].join(' ')}
              >
                Status: {statusLabel}
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar
                value={pct}
                className="h-2.5 bg-white/15"
                barClassName="h-2.5 bg-gradient-to-r from-[#FCAA7A] to-[#FB7A2A]"
              />
            </div>

            <div className="mt-2 text-right text-sm font-semibold text-white/90">
              {pct}% complete
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {stages.map((stage, idx) => {
                const active = idx === activeStageIdx;
                const done = idx < activeStageIdx;

                return (
                  <motion.div
                    key={stage.title}
                    className={[
                      'rounded-card border px-4 py-3',
                      done
                        ? 'border-white/30 bg-white/12'
                        : active
                          ? 'border-white/35 bg-white/16'
                          : 'border-white/10 bg-white/5',
                    ].join(' ')}
                    animate={active ? { scale: [1, 1.015, 1] } : { scale: 1 }}
                    transition={
                      active ? { repeat: Infinity, duration: 1.25 } : { duration: 0 }
                    }
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                      ) : active ? (
                        <Brain className="h-4 w-4 text-white" />
                      ) : (
                        <CircleDot className="h-4 w-4 text-white/70" />
                      )}
                      {stage.title}
                    </div>
                    <div className="mt-1 text-xs text-white/75">
                      {done ? 'Complete' : active ? 'In progress...' : 'Queued'}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      {stage.description}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {screeningNotice ? (
              <div className="mt-5 rounded-card border border-amber-200/35 bg-amber-300/15 px-3 py-2 text-xs text-amber-50">
                {screeningNotice}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
              <div>Elapsed: {elapsed}s</div>
              <div>Estimated remaining: {remaining}s</div>
              <div>
                Run ID:{' '}
                <span className="font-semibold text-white/90">
                  {trackedRun?._id || 'Starting...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
