'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { CandidateDetailSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ScoreCircle } from '@/components/ui/ScoreCircle';
import { SkillTag } from '@/components/ui/SkillTag';
import { useCandidate } from '@/hooks/useCandidates';
import { getCandidateLatestScreening } from '@/lib/api';
import { formatShortDate, initials } from '@/lib/utils';

function CandidateMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-bg p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-text-primary">
        {value}
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { data: candidate, isLoading, error } = useCandidate(id);
  const { data: screeningMatch } = useQuery({
    queryKey: ['candidateLatestScreening', candidate?.id, candidate?.appliedJobId],
    queryFn: () => getCandidateLatestScreening(candidate!),
    enabled: Boolean(candidate),
    staleTime: 15 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return <CandidateDetailSkeleton />;
  }

  if (error || !candidate) {
    return (
      <Card className="p-8">
        <div className="text-lg font-semibold">Candidate not found</div>
        <div className="mt-1 text-sm text-text-muted">
          We could not load this candidate right now.
        </div>
        <div className="mt-4">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const appliedRole =
    candidate.appliedJobTitle || candidate.currentTitle || 'Candidate profile';
  const contactLinks = [
    candidate.email
      ? {
          href: `mailto:${candidate.email}`,
          label: 'Email',
          icon: Mail,
        }
      : null,
    candidate.linkedIn
      ? {
          href: candidate.linkedIn.startsWith('http')
            ? candidate.linkedIn
            : `https://${candidate.linkedIn}`,
          label: 'LinkedIn',
          icon: ExternalLink,
        }
      : null,
  ].filter((item): item is { href: string; label: string; icon: typeof Mail } =>
    Boolean(item)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <PageHeader
        title={candidate.name}
        subtitle={`Candidate profile for ${appliedRole}`}
        backHref="/dashboard"
        right={
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card>
          <CardHeader
            title="Profile Snapshot"
            subtitle="Details available from the current candidate record."
          />
          <CardBody>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
                {initials(candidate.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl font-bold text-text-primary">
                    {candidate.name}
                  </div>
                  <Badge
                    variant={candidate.shortlisted ? 'success' : 'default'}
                  >
                    {candidate.shortlisted ? 'Shortlisted' : 'In review'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <span>{appliedRole}</span>
                  <span className="text-border">/</span>
                  <span>{candidate.location}</span>
                  <span className="text-border">/</span>
                  <span>{candidate.yearsExperience} years experience</span>
                </div>

                {contactLinks.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contactLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target={
                          item.label === 'LinkedIn' ? '_blank' : undefined
                        }
                        rel={
                          item.label === 'LinkedIn' ? 'noreferrer' : undefined
                        }
                        className="inline-flex items-center gap-2 rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-card border border-border bg-bg p-3 text-sm text-text-muted">
                    This candidate record does not include direct contact links
                    yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <CandidateMeta label="Applied Role" value={appliedRole} />
              <CandidateMeta
                label="Experience"
                value={`${candidate.yearsExperience} years`}
              />
              <CandidateMeta
                label="Last Updated"
                value={
                  candidate.updatedAtISO
                    ? formatShortDate(candidate.updatedAtISO)
                    : 'Not available'
                }
              />
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-text-primary">
                Skills
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Technical
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.skills.technical.length > 0 ? (
                    candidate.skills.technical.map((skill) => (
                      <SkillTag key={skill}>{skill}</SkillTag>
                    ))
                  ) : (
                    <div className="text-sm text-text-muted">
                      No technical skills were captured yet.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Additional Signals
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.skills.soft.length > 0 ? (
                    candidate.skills.soft.map((signal) => (
                      <SkillTag key={signal}>{signal}</SkillTag>
                    ))
                  ) : (
                    <div className="text-sm text-text-muted">
                      The backend record has no extra notes attached yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-text-primary">
                Education
              </div>
              <div className="mt-3 space-y-3">
                {candidate.education.length > 0 ? (
                  candidate.education.map((entry) => (
                    <div
                      key={entry}
                      className="rounded-card border border-border bg-bg p-4 text-sm text-text-muted"
                    >
                      {entry}
                    </div>
                  ))
                ) : (
                  <div className="rounded-card border border-border bg-bg p-4 text-sm text-text-muted">
                    No education details were captured in this candidate record
                    yet.
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Hiring Context"
              subtitle="What this record tells the recruiting team today."
            />
            <CardBody className="space-y-4">
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <Briefcase className="h-3.5 w-3.5" />
                  Applied role
                </div>
                <div className="mt-2 text-sm font-semibold text-text-primary">
                  {appliedRole}
                </div>
              </div>

              <div className="rounded-card border border-border bg-bg p-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Current stage
                </div>
                <div className="mt-2 text-sm text-text-muted">
                  {candidate.shortlisted
                    ? 'This candidate is already marked as shortlisted.'
                    : 'This candidate is still in review and has not been shortlisted yet.'}
                </div>
              </div>

              <div className="rounded-card border border-border bg-bg p-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Record timestamps
                </div>
                <div className="mt-2 space-y-1 text-sm text-text-muted">
                  <div>
                    Created:{' '}
                    {candidate.createdAtISO
                      ? formatShortDate(candidate.createdAtISO)
                      : 'Not available'}
                  </div>
                  <div>
                    Updated:{' '}
                    {candidate.updatedAtISO
                      ? formatShortDate(candidate.updatedAtISO)
                      : 'Not available'}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Assessment Status"
              subtitle="Latest saved AI screening result available for this candidate."
            />
            <CardBody>
              {screeningMatch ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-accent/20 bg-accent/8 p-4">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        Latest AI assessment
                      </div>
                      <div className="mt-1 text-sm text-text-muted">
                        {screeningMatch.jobTitle} /{' '}
                        {formatShortDate(screeningMatch.generatedAtISO)}
                      </div>
                    </div>
                    <ScoreCircle
                      score={screeningMatch.result.overall.score}
                      size={70}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-card border border-border bg-bg p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Skills relevance
                      </div>
                      <div className="mt-1 text-lg font-semibold text-text-primary">
                        {screeningMatch.result.dimension_scores.skills_match.score}%
                      </div>
                    </div>
                    <div className="rounded-card border border-border bg-bg p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Education relevance
                      </div>
                      <div className="mt-1 text-lg font-semibold text-text-primary">
                        {screeningMatch.result.dimension_scores.education_fit.score}%
                      </div>
                    </div>
                  </div>

                  <div className="rounded-card border border-border bg-bg p-4 text-sm leading-relaxed text-text-muted">
                    {screeningMatch.result.overall.summary}
                  </div>

                  <Link
                    href={`/dashboard/screening/${screeningMatch.jobId}/results`}
                    className="inline-flex"
                  >
                    <Button variant="outline">Open screening results</Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-card border border-accent/20 bg-accent/8 p-4 text-sm leading-relaxed text-text-muted">
                  No saved screening result is available for this candidate yet.
                  Run AI screening for the candidate&apos;s role to populate
                  score breakdowns and reasoning here.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
