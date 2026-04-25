'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Flag,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { ScreeningResultsSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScoreCircle } from '@/components/ui/ScoreCircle';
import { useCandidates } from '@/hooks/useCandidates';
import {
  getJob,
  getLatestJobResults,
  isMockMode,
  type ScreeningResultApiRecord,
} from '@/lib/api';
import { SCORE_THRESHOLDS } from '@/lib/constants';
import { mockCandidateScores } from '@/lib/mockData';
import { clamp, cn, formatNumber, formatShortDate, initials } from '@/lib/utils';
import type { Candidate, CandidateScore, Job, ScreeningCandidateAnalysis } from '@/types';

type ScreeningVerdict = 'Shortlisted' | 'Review' | 'Rejected';
type VerdictFilter = 'all' | ScreeningVerdict;
const RANKING_PAGE_SIZE = 6;

const WEIGHTS_USED = {
  skills_match: 0.3,
  experience_relevance: 0.25,
  project_quality: 0.15,
  education_fit: 0.1,
  certifications_value: 0.1,
  language_fit: 0.05,
  availability_fit: 0.05,
} as const;

type DimensionKey = keyof typeof WEIGHTS_USED;

type ScreeningResultRecord = {
  screening_id: string;
  candidate_id: string;
  job_id: string;
  evaluated_at: string;
  candidate: Candidate | null;
  candidate_name: string;
  overall: {
    score: number;
    grade: string;
    verdict: ScreeningVerdict;
    summary: string;
  };
  dimension_scores: {
    skills_match: {
      score: number;
      matched: string[];
      missing: string[];
      reasoning: string;
    };
    experience_relevance: {
      score: number;
      total_years: number;
      relevant_years: number;
      highlights: string[];
      reasoning: string;
    };
    education_fit: {
      score: number;
      degree_level: string;
      field_relevance: string;
      reasoning: string;
    };
    project_quality: {
      score: number;
      count: number;
      highlights: string[];
      reasoning: string;
    };
    certifications_value: {
      score: number;
      count: number;
      relevant: string[];
      reasoning: string;
    };
    language_fit: {
      score: number;
      required_met: boolean;
      languages: Array<{ name: string; proficiency: string }>;
    };
    availability_fit: {
      score: number;
      status: string;
      type_match: boolean;
      earliest_start: string;
    };
  };
  weights_used: {
    skills_match: number;
    experience_relevance: number;
    project_quality: number;
    education_fit: number;
    certifications_value: number;
    language_fit: number;
    availability_fit: number;
  };
  flags: {
    career_gap: boolean;
    overqualified: boolean;
    location_mismatch: boolean;
    incomplete_profile: boolean;
  };
  rank: number;
  percentile: number;
};

const DIMENSIONS: Array<{ key: DimensionKey; label: string }> = [
  { key: 'skills_match', label: 'Skills match' },
  { key: 'experience_relevance', label: 'Experience relevance' },
  { key: 'project_quality', label: 'Project quality' },
  { key: 'education_fit', label: 'Education fit' },
  { key: 'certifications_value', label: 'Certifications value' },
  { key: 'language_fit', label: 'Language fit' },
  { key: 'availability_fit', label: 'Availability fit' },
];

function parseList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function scoreToGrade(score: number) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

function scoreToVerdict(score: number): ScreeningVerdict {
  if (score >= SCORE_THRESHOLDS.qualifiedMin) {
    return 'Shortlisted';
  }

  if (score >= SCORE_THRESHOLDS.maybeMin) {
    return 'Review';
  }

  return 'Rejected';
}

function verdictVariant(verdict: ScreeningVerdict) {
  if (verdict === 'Shortlisted') return 'success' as const;
  if (verdict === 'Review') return 'warning' as const;
  return 'danger' as const;
}

function inferRequiredYears(job: Job) {
  const match = `${job.qualifications} ${job.experienceLevel}`.match(/\d+/);
  if (match) {
    return Number(match[0]);
  }

  const level = job.experienceLevel.toLowerCase();
  if (level.includes('senior')) return 5;
  if (level.includes('mid')) return 3;
  if (level.includes('junior')) return 1;
  return 2;
}

function inferDegreeLevel(education: string[]) {
  const text = education.join(' ').toLowerCase();

  if (text.includes('phd') || text.includes('doctor')) return 'PhD';
  if (text.includes('master')) return "Master's";
  if (
    text.includes('bachelor') ||
    text.includes('bsc') ||
    text.includes('beng') ||
    text.includes('ba ')
  ) {
    return "Bachelor's";
  }
  if (text.includes('diploma')) return 'Diploma';
  return education.length > 0 ? 'Formal training' : 'Not listed';
}

function inferFieldRelevance(candidate: Candidate | null, job: Job) {
  const educationText = candidate?.education.join(' ').toLowerCase() ?? '';
  const jobContext = `${job.title} ${job.department}`.toLowerCase();

  if (!educationText) return 'Limited';

  if (
    (jobContext.includes('design') && educationText.includes('design')) ||
    (jobContext.includes('engineer') &&
      (educationText.includes('computer') ||
        educationText.includes('software') ||
        educationText.includes('information'))) ||
    (jobContext.includes('hr') && educationText.includes('human resource'))
  ) {
    return 'High';
  }

  if (
    educationText.includes('business') ||
    educationText.includes('management') ||
    educationText.includes('systems')
  ) {
    return 'Medium';
  }

  return 'Low';
}

function inferRelevantCertifications(candidate: Candidate | null) {
  if (!candidate) {
    return [];
  }

  const signals = [...candidate.skills.technical, ...candidate.education];
  return Array.from(
    new Set(
      signals.filter((value) =>
        /(aws|azure|gcp|cloud|certified|scrum|pmp|security)/i.test(value)
      )
    )
  ).slice(0, 3);
}

function inferLocationMismatch(candidate: Candidate | null, job: Job) {
  if (!candidate) {
    return true;
  }

  if (job.location.toLowerCase().includes('remote')) {
    return false;
  }

  return !job.location.toLowerCase().includes(candidate.location.toLowerCase());
}

function calculatePercentile(rank: number, job: Job, totalResults: number) {
  const population = Math.max(1, job.applicantsCount, totalResults);
  return clamp(Math.round(((population - rank + 1) / population) * 100), 1, 99);
}

function pickCandidate(candidates: Candidate[], result: ScreeningCandidateAnalysis) {
  if (result.candidateId) {
    const byId = candidates.find((candidate) => candidate.id === result.candidateId);
    if (byId) {
      return byId;
    }
  }

  return (
    candidates.find(
      (candidate) =>
        normalizeText(candidate.name) === normalizeText(result.candidateName)
    ) ?? null
  );
}

function mapPersistedScreeningRecord(
  result: ScreeningResultApiRecord,
  candidate: Candidate | null
): ScreeningResultRecord {
  return {
    screening_id: result.screening_id || result._id || `${result.job_id}-${result.candidate_id}`,
    candidate_id: result.candidate_id,
    job_id: result.job_id,
    evaluated_at: result.evaluated_at,
    candidate,
    candidate_name: candidate?.name ?? result.candidate_id,
    overall: result.overall,
    dimension_scores: result.dimension_scores,
    weights_used: result.weights_used,
    flags: result.flags,
    rank: result.rank,
    percentile: result.percentile,
  };
}

function buildScreeningRecord({
  candidate,
  job,
  rank,
  result,
  scoreDetail,
  totalResults,
}: {
  candidate: Candidate | null;
  job: Job;
  rank: number;
  result?: ScreeningCandidateAnalysis;
  scoreDetail?: CandidateScore;
  totalResults: number;
}): ScreeningResultRecord {
  const evaluatedAt = scoreDetail?.screenedAtISO ?? new Date().toISOString();
  const overallScore = clamp(
    Math.round(scoreDetail?.score ?? result?.score ?? 0),
    0,
    100
  );
  const mustHaveSkills = parseList(job.aiCriteria.mustHaveSkills);
  const candidateSkills = candidate?.skills.technical ?? [];
  const matchedSkills = mustHaveSkills.filter((requiredSkill) =>
    candidateSkills.some((candidateSkill) => {
      const left = normalizeText(candidateSkill);
      const right = normalizeText(requiredSkill);
      return left.includes(right) || right.includes(left);
    })
  );
  const missingSkills = mustHaveSkills.filter((skill) => !matchedSkills.includes(skill));
  const requiredYears = inferRequiredYears(job);
  const totalYears = candidate?.yearsExperience ?? requiredYears;
  const relevantYears = clamp(Math.min(totalYears, requiredYears + 1), 0, 40);
  const experienceScore = clamp(
    Math.round(
      scoreDetail?.experiencePct ??
        ((candidate?.yearsExperience ?? requiredYears) / Math.max(requiredYears, 1)) * 100
    ),
    45,
    100
  );
  const educationScore = clamp(
    Math.round(scoreDetail?.educationPct ?? result?.educationPct ?? 75),
    40,
    100
  );
  const skillsScore = clamp(
    Math.round(
      scoreDetail?.skillsMatchPct ??
        result?.skillsMatchPct ??
        (mustHaveSkills.length > 0
          ? (matchedSkills.length / mustHaveSkills.length) * 100
          : overallScore)
    ),
    35,
    100
  );
  const projectHighlights =
    candidate?.workHistory.flatMap((item) => item.highlights).slice(0, 3) ?? [];
  const projectScore = clamp(
    Math.round(overallScore * 0.55 + projectHighlights.length * 14),
    50,
    98
  );
  const certifications = inferRelevantCertifications(candidate);
  const certificationsScore = clamp(
    certifications.length > 0 ? 55 + certifications.length * 15 : 48,
    40,
    95
  );
  const locationMismatch = inferLocationMismatch(candidate, job);
  const incompleteProfile = Boolean(
    !candidate ||
      candidate.skills.technical.length === 0 ||
      candidate.workHistory.length === 0
  );
  const overqualified = totalYears >= requiredYears + 4;
  const summary =
    scoreDetail?.reasoning?.trim() ??
    result?.reasoning?.trim() ??
    'The current profile aligns with the job brief and is ready for recruiter review.';

  return {
    screening_id: `screening-${job.id}-${candidate?.id ?? result?.candidateName ?? rank}`,
    candidate_id: candidate?.id ?? result?.candidateId ?? `candidate-${rank}`,
    job_id: job.id,
    evaluated_at: evaluatedAt,
    candidate,
    candidate_name: candidate?.name ?? result?.candidateName ?? `Candidate ${rank}`,
    overall: {
      score: overallScore,
      grade: scoreToGrade(overallScore),
      verdict: scoreToVerdict(overallScore),
      summary,
    },
    dimension_scores: {
      skills_match: {
        score: skillsScore,
        matched: matchedSkills.slice(0, 4),
        missing: missingSkills.slice(0, 3),
        reasoning:
          mustHaveSkills.length > 0
            ? `Covers ${matchedSkills.length} of ${mustHaveSkills.length} required skills in the current brief.`
            : 'Skill coverage is based on the available profile details.',
      },
      experience_relevance: {
        score: experienceScore,
        total_years: totalYears,
        relevant_years: relevantYears,
        highlights:
          candidate?.workHistory.flatMap((entry) => entry.highlights).slice(0, 2) ?? [],
        reasoning:
          totalYears >= requiredYears
            ? 'Experience depth meets or exceeds the expected range for this role.'
            : 'Relevant experience exists, but recruiter validation is still recommended.',
      },
      education_fit: {
        score: educationScore,
        degree_level: inferDegreeLevel(candidate?.education ?? []),
        field_relevance: inferFieldRelevance(candidate, job),
        reasoning:
          candidate?.education.length
            ? 'Education evidence supports the role requirements.'
            : 'Education details are limited in the current profile.',
      },
      project_quality: {
        score: projectScore,
        count: Math.max(projectHighlights.length, candidate?.workHistory.length ?? 1),
        highlights: projectHighlights.slice(0, 2),
        reasoning:
          projectHighlights.length > 0
            ? 'Project evidence shows practical execution beyond role titles.'
            : 'Project evidence is limited, so the score leans more on work history.',
      },
      certifications_value: {
        score: certificationsScore,
        count: certifications.length,
        relevant: certifications,
        reasoning:
          certifications.length > 0
            ? 'Relevant certifications add confidence to the profile.'
            : 'No strong certification signal was identified in the available data.',
      },
      language_fit: {
        score: 95,
        required_met: true,
        languages: [{ name: 'English', proficiency: 'Fluent' }],
      },
      availability_fit: {
        score: locationMismatch ? 76 : 100,
        status: 'Available',
        type_match: true,
        earliest_start: new Date(
          new Date(evaluatedAt).getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    },
    weights_used: WEIGHTS_USED,
    flags: {
      career_gap: false,
      overqualified,
      location_mismatch: locationMismatch,
      incomplete_profile: incompleteProfile,
    },
    rank,
    percentile: calculatePercentile(rank, job, totalResults),
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatEvaluationWindow(records: ScreeningResultRecord[]) {
  if (records.length === 0) {
    return formatShortDate(new Date().toISOString());
  }

  const values = records.map((record) => new Date(record.evaluated_at).getTime());
  const earliest = new Date(Math.min(...values)).toISOString();
  const latest = new Date(Math.max(...values)).toISOString();

  if (formatShortDate(earliest) === formatShortDate(latest)) {
    return formatShortDate(latest);
  }

  return `${formatShortDate(earliest)} - ${formatShortDate(latest)}`;
}

function exportRecordsAsCsv(records: ScreeningResultRecord[], jobTitle: string) {
  const headers = [
    'candidate_name',
    'overall_score',
    'grade',
    'verdict',
    'rank',
    'percentile',
    'skills_match',
    'experience_relevance',
    'education_fit',
    'project_quality',
    'certifications_value',
    'language_fit',
    'availability_fit',
    'summary',
  ];

  const rows = records.map((record) =>
    [
      JSON.stringify(record.candidate_name),
      record.overall.score,
      record.overall.grade,
      record.overall.verdict,
      record.rank,
      record.percentile,
      record.dimension_scores.skills_match.score,
      record.dimension_scores.experience_relevance.score,
      record.dimension_scores.education_fit.score,
      record.dimension_scores.project_quality.score,
      record.dimension_scores.certifications_value.score,
      record.dimension_scores.language_fit.score,
      record.dimension_scores.availability_fit.score,
      JSON.stringify(record.overall.summary),
    ].join(',')
  );

  const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${jobTitle.toLowerCase().replace(/\s+/g, '-')}-screening-results.csv`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-[22px] border-border/60 bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-text-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-text-primary">
            {value}
          </div>
          <div className="mt-3 text-sm text-text-muted">{hint}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="text-xl font-semibold tracking-[-0.03em] text-text-primary">
          {title}
        </div>
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function DimensionRow({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#111F3A]/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold tracking-[-0.02em] text-white">
          {label}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
            {weight}% weight
          </span>
          <span className="text-3xl font-semibold tracking-[-0.03em] text-white">
            {score}
          </span>
        </div>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-slate-500/35">
        <div
          className="h-2.5 rounded-full bg-[#FF7A1A]"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function EvidenceBlock({
  title,
  items,
  emptyLabel,
  variant = 'default',
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  variant?: 'default' | 'success' | 'warning';
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={item}
              variant={
                variant === 'success'
                  ? 'success'
                  : variant === 'warning'
                    ? 'warning'
                    : 'default'
              }
            >
              {item}
            </Badge>
          ))
        ) : (
          <Badge variant={variant === 'success' ? 'success' : 'default'}>
            {emptyLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function DashboardScreeningResultsPage() {
  const params = useParams<{ id: string }>();
  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;
  const mockMode = isMockMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all');
  const [rankingPage, setRankingPage] = useState(1);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>();

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const { data: candidates, isLoading: areCandidatesLoading } = useCandidates();
  const { data: latestResults, isLoading: areResultsLoading } = useQuery({
    queryKey: ['latestScreeningResults', jobId],
    queryFn: () => getLatestJobResults(jobId),
    enabled: Boolean(jobId),
    staleTime: 15 * 1000,
    retry: 1,
  });

  const records = useMemo(() => {
    if (!job || !candidates) {
      return [] as ScreeningResultRecord[];
    }

    if (mockMode) {
      const scoreRows = mockCandidateScores
        .filter((score) => score.jobId === job.id)
        .sort((left, right) => right.score - left.score);

      return scoreRows.map((scoreDetail, index) =>
        buildScreeningRecord({
          candidate:
            candidates.find((candidate) => candidate.id === scoreDetail.candidateId) ??
            null,
          job,
          rank: index + 1,
          scoreDetail,
          totalResults: scoreRows.length,
        })
      );
    }

    const resultRows = latestResults?.results ?? [];

    return resultRows.map((result) =>
      mapPersistedScreeningRecord(
        result,
        candidates.find(
          (candidate) =>
            candidate.id === result.candidate_id ||
            candidate.id === result.applicant_id
        ) ?? null
      )
    );
  }, [candidates, job, latestResults?.results, mockMode]);

  useEffect(() => {
    if (!records.length) {
      setSelectedScreeningId(undefined);
      return;
    }

    if (
      !selectedScreeningId ||
      !records.some((record) => record.screening_id === selectedScreeningId)
    ) {
      setSelectedScreeningId(records[0]?.screening_id);
    }
  }, [records, selectedScreeningId]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesVerdict =
        verdictFilter === 'all' || record.overall.verdict === verdictFilter;
      const query = searchQuery.trim().toLowerCase();

      if (!query) {
        return matchesVerdict;
      }

      const haystack = [
        record.candidate_name,
        record.candidate?.currentTitle,
        record.candidate?.company,
        record.candidate?.location,
        record.overall.verdict,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesVerdict && haystack.includes(query);
    });
  }, [records, searchQuery, verdictFilter]);

  const totalRankingPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / RANKING_PAGE_SIZE)
  );
  const rankingPageStart = (rankingPage - 1) * RANKING_PAGE_SIZE;
  const pagedRecords = filteredRecords.slice(
    rankingPageStart,
    rankingPageStart + RANKING_PAGE_SIZE
  );
  const rankingPageNumbers = useMemo(() => {
    const maxButtons = 5;
    const end = Math.min(
      totalRankingPages,
      Math.max(maxButtons, rankingPage + Math.floor(maxButtons / 2))
    );
    const start = Math.max(1, end - (maxButtons - 1));
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [rankingPage, totalRankingPages]);
  const visibleStart =
    filteredRecords.length === 0 ? 0 : rankingPageStart + 1;
  const visibleEnd = Math.min(
    rankingPageStart + RANKING_PAGE_SIZE,
    filteredRecords.length
  );

  useEffect(() => {
    setRankingPage(1);
  }, [searchQuery, verdictFilter]);

  useEffect(() => {
    if (rankingPage > totalRankingPages) {
      setRankingPage(totalRankingPages);
    }
  }, [rankingPage, totalRankingPages]);

  useEffect(() => {
    if (!pagedRecords.length) {
      return;
    }

    if (
      !selectedScreeningId ||
      !pagedRecords.some((record) => record.screening_id === selectedScreeningId)
    ) {
      setSelectedScreeningId(pagedRecords[0].screening_id);
    }
  }, [pagedRecords, selectedScreeningId]);

  const selectedRecord =
    pagedRecords.find((record) => record.screening_id === selectedScreeningId) ??
    pagedRecords[0] ??
    filteredRecords[0] ??
    records[0] ??
    null;

  const totalScreened = records.length;
  const shortlistedCount = records.filter(
    (record) => record.overall.verdict === 'Shortlisted'
  ).length;
  const reviewCount = records.filter(
    (record) => record.overall.verdict === 'Review'
  ).length;
  const averageScore = average(records.map((record) => record.overall.score));
  const evaluationWindow = formatEvaluationWindow(records);

  if (isJobLoading || areCandidatesLoading || areResultsLoading) {
    return <ScreeningResultsSkeleton />;
  }

  if (!job) {
    return (
      <Card className="rounded-[24px] p-10">
        <div className="text-2xl font-semibold text-text-primary">Job not found</div>
        <p className="mt-3 max-w-2xl text-text-muted">
          We could not load the screening workspace for this job.
        </p>
      </Card>
    );
  }

  if (!mockMode && !latestResults) {
    return (
      <Card className="rounded-[24px] p-10">
        <div className="max-w-2xl">
          <Badge variant="info">Talvo AI Screening</Badge>
          <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-text-primary">
            No screening run has been saved yet
          </div>
          <p className="mt-3 text-base leading-7 text-text-muted">
            Run Talvo AI screening first so this workspace can populate with ranked
            candidates, score breakdowns, and recruiter-ready recommendations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/dashboard/screening/${jobId}/progress`}>
              <Button className="rounded-full px-6">Run Talvo AI screening</Button>
            </Link>
            <Link href={`/dashboard/screening/${jobId}`}>
              <Button variant="outline" className="rounded-full px-6">
                Back to intake
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[28px] border-border/60 bg-surface p-6 shadow-soft">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Badge variant="info" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Talvo AI Screening
            </Badge>
            <div className="mt-4 text-[2rem] font-semibold tracking-[-0.05em] text-text-primary">
              {job.title}
            </div>
            <p className="mt-2 max-w-2xl text-base leading-7 text-text-muted">
              Structured screening results with weighted dimensions, reviewer-ready
              summaries, and a clearer shortlist view for your hiring team.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge>{job.department}</Badge>
              <Badge>{job.employmentType}</Badge>
              <Badge>{job.location}</Badge>
              <Badge>{evaluationWindow}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => exportRecordsAsCsv(filteredRecords, job.title)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-bg/30 px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg/60"
            >
              <Download className="h-4 w-4 text-accent" />
              Export CSV
            </button>
            <Link href={`/dashboard/screening/${jobId}`}>
              <Button variant="outline" className="rounded-full px-5">
                Back to intake
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total screened"
          value={formatNumber(totalScreened)}
          hint={`${formatNumber(job.applicantsCount)} applicants currently tied to this role`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Shortlisted"
          value={formatNumber(shortlistedCount)}
          hint={`${reviewCount} candidates remain in the review bucket`}
        />
        <MetricCard
          icon={Trophy}
          label="Average score"
          value={`${averageScore}`}
          hint="Overall score across the current screening run"
        />
        <MetricCard
          icon={Briefcase}
          label="Target shortlist"
          value={`${job.aiCriteria.shortlistSize}`}
          hint={`${Math.max(job.aiCriteria.shortlistSize - shortlistedCount, 0)} more candidates needed to hit target`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden rounded-[24px] border-border/60 bg-surface shadow-soft">
          <div className="border-b border-border/60 px-6 py-5">
            <SectionTitle
              title="Candidate ranking"
              subtitle="Search, filter, and review the strongest profiles in the current run."
              right={
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'Shortlisted', 'Review', 'Rejected'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVerdictFilter(option)}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
                        verdictFilter === option
                          ? 'border-accent bg-accent text-white'
                          : 'border-border/70 bg-bg/20 text-text-muted hover:bg-bg/40 hover:text-text-primary'
                      )}
                    >
                      {option === 'all' ? <Filter className="h-4 w-4" /> : null}
                      {option}
                    </button>
                  ))}
                </div>
              }
            />

            <label className="mt-4 flex h-11 items-center gap-2 rounded-full border border-border/70 bg-bg/20 px-4">
              <Search className="h-4 w-4 text-text-muted" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search candidate, title, or location"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  <th className="px-4 pt-4">Candidate</th>
                  <th className="px-4 pt-4">Verdict</th>
                  <th className="px-4 pt-4">Score</th>
                  <th className="px-4 pt-4">Skills</th>
                  <th className="px-4 pt-4">Experience</th>
                  <th className="px-4 pt-4">Rank</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((record) => {
                  const active = record.screening_id === selectedRecord?.screening_id;

                  return (
                    <tr
                      key={record.screening_id}
                      onClick={() => setSelectedScreeningId(record.screening_id)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        active ? 'bg-accent/6' : 'bg-bg/20 hover:bg-bg/35'
                      )}
                    >
                      <td className="rounded-l-[18px] px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-sm font-semibold text-accent">
                            {initials(record.candidate_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-text-primary">
                              {record.candidate_name}
                            </div>
                            <div className="truncate text-sm text-text-muted">
                              {record.candidate?.currentTitle ?? 'Candidate profile'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={verdictVariant(record.overall.verdict)} dot>
                          {record.overall.verdict}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-text-primary">
                        {record.overall.score}
                      </td>
                      <td className="px-4 py-4 text-sm text-text-muted">
                        {record.dimension_scores.skills_match.score}%
                      </td>
                      <td className="px-4 py-4 text-sm text-text-muted">
                        {record.dimension_scores.experience_relevance.total_years} years
                      </td>
                      <td className="rounded-r-[18px] px-4 py-4 text-sm font-semibold text-text-primary">
                        #{record.rank}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRecords.length === 0 ? (
              <div className="px-4 py-10 text-sm text-text-muted">
                No candidates match the current search and filter settings.
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-4 pb-2">
                <div className="text-sm text-text-muted">
                  Showing{' '}
                  <span className="font-semibold text-text-primary">
                    {visibleStart}-{visibleEnd}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-text-primary">
                    {filteredRecords.length}
                  </span>{' '}
                  candidates
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRankingPage((current) => Math.max(1, current - 1))}
                    disabled={rankingPage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-bg/20 text-text-muted transition-colors hover:bg-bg/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous ranking page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {rankingPageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setRankingPage(pageNumber)}
                      className={cn(
                        'inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors',
                        rankingPage === pageNumber
                          ? 'border-accent bg-accent text-white'
                          : 'border-border/70 bg-bg/20 text-text-muted hover:bg-bg/40 hover:text-text-primary'
                      )}
                      aria-label={`Go to ranking page ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setRankingPage((current) =>
                        Math.min(totalRankingPages, current + 1)
                      )
                    }
                    disabled={rankingPage === totalRankingPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-bg/20 text-text-muted transition-colors hover:bg-bg/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next ranking page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-[24px] border-border/60 bg-surface p-6 shadow-soft">
          {selectedRecord ? (
            <>
              <SectionTitle
                title="Selected candidate"
                subtitle="A concise recruiter summary for the active screening record."
                right={
                  <Badge variant={verdictVariant(selectedRecord.overall.verdict)} dot>
                    {selectedRecord.overall.verdict}
                  </Badge>
                }
              />

              <div className="mt-6 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-base font-semibold text-accent">
                  {initials(selectedRecord.candidate_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-semibold text-text-primary">
                    {selectedRecord.candidate_name}
                  </div>
                  <div className="mt-1 text-sm text-text-muted">
                    {selectedRecord.candidate?.currentTitle ?? 'Candidate profile'}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedRecord.candidate?.location ?? 'Location pending'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {selectedRecord.dimension_scores.experience_relevance.total_years} years
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {selectedRecord.dimension_scores.education_fit.degree_level}
                    </span>
                  </div>
                </div>
                <ScoreCircle
                  score={selectedRecord.overall.score}
                  size={88}
                  label={`Grade ${selectedRecord.overall.grade}`}
                />
              </div>

              <p className="mt-6 rounded-[18px] border border-border/60 bg-bg/20 p-4 text-sm leading-7 text-text-muted">
                {selectedRecord.overall.summary}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-border/60 bg-bg/20 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    Rank
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-text-primary">
                    #{selectedRecord.rank}
                  </div>
                </div>
                <div className="rounded-[18px] border border-border/60 bg-bg/20 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    Percentile
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-text-primary">
                    {selectedRecord.percentile}%
                  </div>
                </div>
                <div className="rounded-[18px] border border-border/60 bg-bg/20 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    Evaluated
                  </div>
                  <div className="mt-2 text-base font-semibold text-text-primary">
                    {formatShortDate(selectedRecord.evaluated_at)}
                  </div>
                </div>
                <div className="rounded-[18px] border border-border/60 bg-bg/20 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    Earliest start
                  </div>
                  <div className="mt-2 text-base font-semibold text-text-primary">
                    {formatShortDate(
                      selectedRecord.dimension_scores.availability_fit.earliest_start
                    )}
                  </div>
                </div>
              </div>

              {selectedRecord.candidate ? (
                <Link
                  href={`/dashboard/candidates/${selectedRecord.candidate.id}`}
                  className="mt-6 inline-flex text-sm font-semibold text-accent"
                >
                  Open full candidate profile
                </Link>
              ) : null}
            </>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[24px] border-slate-700/70 bg-gradient-to-br from-[#0D1A34] via-[#111F3C] to-[#0B1730] p-6 shadow-soft">
          {selectedRecord ? (
            <>
              <div>
                <div className="text-[2rem] font-semibold tracking-[-0.04em] text-white">
                  Weighted dimensions
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  How the final score is distributed across the screening rubric.
                </p>
              </div>
              <div className="mt-6 space-y-4">
                {DIMENSIONS.map((dimension) => (
                  <DimensionRow
                    key={dimension.key}
                    label={dimension.label}
                    score={selectedRecord.dimension_scores[dimension.key].score}
                    weight={Math.round(selectedRecord.weights_used[dimension.key] * 100)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </Card>

        <Card className="rounded-[24px] border-border/60 bg-surface p-6 shadow-soft">
          {selectedRecord ? (
            <>
              <SectionTitle
                title="Evidence and flags"
                subtitle="The key signals Talvo AI surfaced for this candidate."
              />

              <div className="mt-6 space-y-6">
                <EvidenceBlock
                  title="Matched skills"
                  items={selectedRecord.dimension_scores.skills_match.matched}
                  emptyLabel="No strong skill matches yet"
                  variant="success"
                />

                <EvidenceBlock
                  title="Missing signals"
                  items={selectedRecord.dimension_scores.skills_match.missing}
                  emptyLabel="No major gaps detected"
                  variant="warning"
                />

                <EvidenceBlock
                  title="Project highlights"
                  items={selectedRecord.dimension_scores.project_quality.highlights}
                  emptyLabel="Project evidence is limited"
                />

                <EvidenceBlock
                  title="Certifications"
                  items={selectedRecord.dimension_scores.certifications_value.relevant}
                  emptyLabel="No relevant certifications identified"
                />

                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Reviewer notes
                  </div>
                  <div className="mt-3 rounded-[18px] border border-border/60 bg-bg/20 p-4 text-sm leading-7 text-text-muted">
                    {selectedRecord.dimension_scores.experience_relevance.reasoning}
                    {' '}
                    {selectedRecord.dimension_scores.education_fit.reasoning}
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <Flag className="h-4 w-4 text-accent" />
                    Active flags
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(selectedRecord.flags).some(([, value]) => value) ? (
                      Object.entries(selectedRecord.flags)
                        .filter(([, value]) => value)
                        .map(([key]) => (
                          <Badge key={key} variant="warning">
                            {key.replace(/_/g, ' ')}
                          </Badge>
                        ))
                    ) : (
                      <Badge variant="success">No active risk flags</Badge>
                    )}
                  </div>
                </div>

                <div className="rounded-[18px] border border-border/60 bg-bg/20 p-4">
                  <div className="text-sm font-semibold text-text-primary">
                    Availability fit
                  </div>
                  <div className="mt-2 text-sm text-text-muted">
                    {selectedRecord.dimension_scores.availability_fit.status} • starts
                    {' '}
                    {formatShortDate(
                      selectedRecord.dimension_scores.availability_fit.earliest_start
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
