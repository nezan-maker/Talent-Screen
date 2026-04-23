'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Mail, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreCircle } from '@/components/ui/ScoreCircle';
import { SkillTag } from '@/components/ui/SkillTag';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCandidates } from '@/hooks/useCandidates';
import { getJob, getStoredScreeningAnalysis, isMockMode } from '@/lib/api';
import { SCORE_THRESHOLDS } from '@/lib/constants';
import { initials } from '@/lib/utils';
import { mockCandidateScores, mockCandidates, mockJobs } from '@/lib/mockData';
import type {
  Candidate,
  ScreeningAnalysis,
  ScreeningCandidateAnalysis,
} from '@/types';

type FilterTab = 'all' | 'qualified' | 'maybe';

function bucket(score: number): FilterTab | 'notQualified' {
  if (score >= SCORE_THRESHOLDS.qualifiedMin) return 'qualified';
  if (score >= SCORE_THRESHOLDS.maybeMin) return 'maybe';
  return 'notQualified';
}

function hoursAgoLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  return `${hours} hours ago`;
}

function exportRowsAsCsv(
  rows: Array<{ candidate?: Candidate; result: ScreeningCandidateAnalysis }>,
  jobTitle: string
) {
  const csvRows = [
    [
      'job_title',
      'candidate_name',
      'score',
      'skills_relevance',
      'education_relevance',
      'reasoning',
    ].join(','),
    ...rows.map(({ candidate, result }) =>
      [
        JSON.stringify(jobTitle),
        JSON.stringify(candidate?.name ?? result.candidateName),
        result.score,
        result.skillsMatchPct,
        result.educationPct,
        JSON.stringify(result.reasoning),
      ].join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${jobTitle.toLowerCase().replace(/\s+/g, '-')}-screening-results.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function CandidateCard({
  candidate,
  result,
  screenedAtISO,
}: {
  candidate?: Candidate;
  result: ScreeningCandidateAnalysis;
  screenedAtISO: string;
}) {
  const displayName = candidate?.name ?? result.candidateName;
  const displayRole =
    candidate?.currentTitle ??
    candidate?.appliedJobTitle ??
    'Candidate profile';
  const location = candidate?.location ?? 'Location not provided';
  const yearsExperience = candidate?.yearsExperience;
  const technicalSkills = candidate?.skills.technical ?? [];
  const isTop = result.score >= 90;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">
                {initials(displayName)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={
                      isTop
                        ? 'text-base font-bold text-accent'
                        : 'text-base font-bold'
                    }
                  >
                    {displayName}
                  </div>
                  {isTop ? (
                    <Badge variant="success">Top Candidate</Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-text-muted">
                  {displayRole} • {location}
                  {typeof yearsExperience === 'number'
                    ? ` • ${yearsExperience} yrs`
                    : ''}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {technicalSkills.length > 0 ? (
                technicalSkills
                  .slice(0, 6)
                  .map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)
              ) : (
                <div className="text-sm text-text-muted">
                  No saved skill tags were available for this candidate.
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <ScoreCircle score={result.score} />
          </div>
        </div>

        <div className="mt-4 rounded-card border border-accent/15 bg-accent/8 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-accent" />
            AI Reasoning
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {result.reasoning}
          </p>
          {candidate ? (
            <div className="mt-3">
              <Link
                className="text-sm font-semibold text-accent hover:text-accent-hover"
                href={`/dashboard/candidates/${candidate.id}`}
              >
                View detailed analysis →
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <div>
            <span className="inline-block h-2 w-2 rounded-full bg-success align-middle" />{' '}
            <span className="font-semibold text-text-primary">
              {result.skillsMatchPct}%
            </span>{' '}
            Skills Relevance
          </div>
          <div>
            <span className="font-semibold text-text-primary">
              {result.educationPct}%
            </span>{' '}
            Education Relevance
          </div>
          <div className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Screened {hoursAgoLabel(screenedAtISO)}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? 'job_001';
  const mockMode = isMockMode();
  const { data: backendJob, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId) && !mockMode,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const { data: candidates = [] } = useCandidates();
  const [analysis, setAnalysis] = useState<ScreeningAnalysis | null>(null);
  const mockJob = mockJobs.find((job) => job.id === jobId) ?? mockJobs[0];
  const job = mockMode ? mockJob : backendJob;
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [sort, setSort] = useState<'scoreDesc' | 'scoreAsc'>('scoreDesc');

  useEffect(() => {
    if (mockMode) {
      return;
    }

    setAnalysis(getStoredScreeningAnalysis(jobId));
  }, [jobId, mockMode]);

  const rows = useMemo(() => {
    const joined = mockMode
      ? mockCandidateScores
          .filter((score) => score.jobId === mockJob.id)
          .map((score) => ({
            result: {
              candidateId: score.candidateId,
              candidateName:
                mockCandidates.find(
                  (candidate) => candidate.id === score.candidateId
                )?.name ?? 'Candidate',
              score: score.score,
              skillsMatchPct: score.skillsMatchPct,
              educationPct: score.educationPct,
              reasoning: score.reasoning,
            } satisfies ScreeningCandidateAnalysis,
            candidate: mockCandidates.find(
              (candidate) => candidate.id === score.candidateId
            ),
          }))
      : (analysis?.applicants ?? []).map((result) => ({
          result,
          candidate:
            candidates.find(
              (candidate) =>
                result.candidateId && candidate.id === result.candidateId
            ) ??
            candidates.find(
              (candidate) =>
                candidate.name.trim().toLowerCase() ===
                result.candidateName.trim().toLowerCase()
            ),
        }));

    const query = q.trim().toLowerCase();
    const filtered = joined.filter(({ candidate, result }) => {
      if (tab !== 'all' && bucket(result.score) !== tab) {
        return false;
      }

      if (!query) {
        return true;
      }

      const displayName = candidate?.name ?? result.candidateName;
      const displayTitle =
        candidate?.currentTitle ?? candidate?.appliedJobTitle ?? '';
      const skills = candidate?.skills.technical ?? [];

      return (
        displayName.toLowerCase().includes(query) ||
        displayTitle.toLowerCase().includes(query) ||
        skills.some((skill) => skill.toLowerCase().includes(query))
      );
    });

    filtered.sort((left, right) =>
      sort === 'scoreDesc'
        ? right.result.score - left.result.score
        : left.result.score - right.result.score
    );
    return filtered;
  }, [analysis?.applicants, candidates, mockJob.id, mockMode, q, sort, tab]);

  const summary = useMemo(() => {
    const all = rows.map((row) => row.result);
    const qualified = all.filter(
      (result) => result.score >= SCORE_THRESHOLDS.qualifiedMin
    ).length;
    const maybe = all.filter(
      (result) =>
        result.score >= SCORE_THRESHOLDS.maybeMin &&
        result.score < SCORE_THRESHOLDS.qualifiedMin
    ).length;
    const notQualified = all.filter(
      (result) => result.score < SCORE_THRESHOLDS.maybeMin
    ).length;
    return { total: all.length, qualified, maybe, notQualified };
  }, [rows]);

  if (!mockMode && jobLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <PageHeader
          title="Screening Results"
          subtitle="Loading the latest screening results"
          backHref={`/dashboard/screening/${jobId}`}
        />

        <div className="mt-8">
          <Card className="p-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-3 h-4 w-72" />
            <Skeleton className="mt-6 h-48 w-full" />
          </Card>
        </div>
      </motion.div>
    );
  }

  if (!mockMode && !analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <PageHeader
          title="Screening Results"
          subtitle="Run the AI screening flow first to populate shortlist results for this job."
          backHref={`/dashboard/screening/${jobId}`}
        />

        <div className="mt-8">
          <Card className="p-8">
            <div className="text-lg font-semibold text-text-primary">
              No screening run has been saved yet
            </div>
            <div className="mt-2 text-sm leading-relaxed text-text-muted">
              The backend can score applicants through the screening route, but
              this job does not have a stored result in the frontend session
              yet.
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/dashboard/screening/${jobId}/progress`}>
                <Button>Run AI Screening</Button>
              </Link>
              <Link href={`/dashboard/screening/${jobId}`}>
                <Button variant="outline">Back to Intake</Button>
              </Link>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  const verdict = mockMode
    ? 'Top candidates shortlisted based on mock screening scores.'
    : (analysis?.verdict ?? 'Screening completed successfully');
  const screenedAtISO = mockMode
    ? new Date().toISOString()
    : (analysis?.generatedAtISO ?? new Date().toISOString());
  const jobTitle = job?.title ?? analysis?.jobTitle ?? mockJob.title;
  const jobSubtitle = job
    ? `${job.title} • ${job.department}`
    : (analysis?.jobTitle ?? 'Screening results');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Shortlist Results"
        subtitle={jobSubtitle}
        backHref={`/dashboard/screening/${jobId}`}
        right={
          <>
            <Button
              variant="outline"
              onClick={() => {
                if (rows.length === 0) {
                  toast.error('There are no results to export yet.');
                  return;
                }

                exportRowsAsCsv(rows, jobTitle);
                toast.success('Screening results exported.');
              }}
              type="button"
            >
              Export
            </Button>
            <Button
              onClick={() =>
                toast(
                  'Email delivery is not wired yet, but the shortlist is ready to review.',
                  { icon: 'i' }
                )
              }
              type="button"
            >
              <Mail className="h-4 w-4" />
              Email Shortlist
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Screened',
            value: summary.total,
            variant: 'default' as const,
          },
          {
            label: 'Highly Qualified',
            value: summary.qualified,
            variant: 'success' as const,
            meta: 'Score 80+',
          },
          {
            label: 'Maybe',
            value: summary.maybe,
            variant: 'warning' as const,
            meta: 'Score 60-79',
          },
          {
            label: 'Not Qualified',
            value: summary.notQualified,
            variant: 'danger' as const,
            meta: 'Score <60',
          },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-text-muted">
                  {item.label}
                </div>
                <div className="mt-2 text-3xl font-bold">
                  <span
                    className={
                      item.variant !== 'default' ? `text-${item.variant}` : ''
                    }
                  >
                    {item.value}
                  </span>
                </div>
                {item.meta ? (
                  <div className="mt-1 text-xs text-text-muted">
                    {item.meta}
                  </div>
                ) : null}
              </div>
              <Badge variant={item.variant}>
                {item.variant === 'default' ? 'All' : item.label}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-card border border-accent/20 bg-accent/8 p-4 text-sm text-text-muted">
        <span className="font-semibold text-text-primary">Verdict:</span>{' '}
        {verdict}
      </div>

      <div className="mt-8 rounded-card border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="h-10 w-full rounded-input border border-border bg-card pl-10 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-accent/30"
              placeholder="Search candidates…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: `All (${summary.total})` },
                { id: 'qualified', label: `Qualified (${summary.qualified})` },
                { id: 'maybe', label: `Maybe (${summary.maybe})` },
              ] as Array<{ id: FilterTab; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={[
                  'rounded-badge border px-3 py-2 text-sm font-semibold',
                  tab === item.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-white text-text-muted',
                ].join(' ')}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            className="inline-flex h-10 items-center gap-2 rounded-input border border-border bg-white px-3 text-sm font-semibold text-text-muted hover:bg-bg"
            onClick={() =>
              setSort((current) =>
                current === 'scoreDesc' ? 'scoreAsc' : 'scoreDesc'
              )
            }
            type="button"
          >
            Sort by Score
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">
              No candidates match your filters
            </div>
            <div className="mt-1 text-sm text-text-muted">
              Try clearing search or switching tabs.
            </div>
          </Card>
        ) : (
          rows.map(({ candidate, result }) => (
            <CandidateCard
              key={`${candidate?.id ?? result.candidateId ?? result.candidateName}-${result.score}`}
              candidate={candidate}
              result={result}
              screenedAtISO={screenedAtISO}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
