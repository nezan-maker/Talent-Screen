'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, FileUp, Filter, Search, Upload, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScreeningIntakeSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SkillTag } from '@/components/ui/SkillTag';
import { useCandidates } from '@/hooks/useCandidates';
import {
  getApiErrorMessage,
  getJob,
  registerCandidates,
  type RegisterCandidateInput,
  uploadCandidatesFile,
  uploadResumeZip,
} from '@/lib/api';
import { initials } from '@/lib/utils';

type Tab = 'pool' | 'upload' | 'manual';

type ManualCandidateForm = {
  applicant_name: string;
  job_title: string;
  skills: string;
  education_certificates: string;
  additional_info: string;
  experience_in_years: string;
};

const initialManualForm: ManualCandidateForm = {
  applicant_name: '',
  job_title: '',
  skills: '',
  education_certificates: '',
  additional_info: '',
  experience_in_years: '',
};

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function inputClass(hasError?: boolean) {
  return [
    'mt-2 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2',
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-border focus:border-accent/40 focus:ring-accent/20',
  ].join(' ');
}

function formatIntakeSummary(
  summary: {
    source: 'upload' | 'manual';
    createdCount: number;
    skippedCount: number;
    uploadedResumeCount?: number;
  } | null
) {
  if (!summary) {
    return 'No candidate intake has been completed in this session yet.';
  }

  const parts = [
    `${summary.createdCount} created`,
    `${summary.skippedCount} skipped`,
  ];

  if (typeof summary.uploadedResumeCount === 'number') {
    parts.push(`${summary.uploadedResumeCount} resume PDFs uploaded`);
  }

  parts.push(`via ${summary.source}`);
  return `${parts.join(', ')}.`;
}

export default function ScreeningIngestionPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? '';
  const queryClient = useQueryClient();
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const resumeZipInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>('pool');
  const [q, setQ] = useState('');
  const [showRoleMatchesOnly, setShowRoleMatchesOnly] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [resumeZipFile, setResumeZipFile] = useState<File | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualForm, setManualForm] =
    useState<ManualCandidateForm>(initialManualForm);
  const [manualErrors, setManualErrors] = useState<
    Partial<Record<keyof ManualCandidateForm, string>>
  >({});
  const [lastIntakeSummary, setLastIntakeSummary] = useState<{
    source: 'upload' | 'manual';
    createdCount: number;
    skippedCount: number;
    uploadedResumeCount?: number;
  } | null>(null);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const {
    data: candidates = [],
    isLoading: candidatesLoading,
    error,
  } = useCandidates();

  const roleMatchedCandidates = useMemo(() => {
    if (!job) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const role = (candidate.appliedJobTitle || candidate.currentTitle || '')
        .trim()
        .toLowerCase();
      return role === job.title.trim().toLowerCase();
    });
  }, [candidates, job]);
  const canRunScreening = Boolean(job && roleMatchedCandidates.length > 0);

  const filteredCandidates = useMemo(() => {
    const source = showRoleMatchesOnly ? roleMatchedCandidates : candidates;
    const query = q.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((candidate) => {
      return (
        candidate.name.toLowerCase().includes(query) ||
        (candidate.appliedJobTitle || candidate.currentTitle || '')
          .toLowerCase()
          .includes(query) ||
        candidate.skills.technical.some((skill) =>
          skill.toLowerCase().includes(query)
        )
      );
    });
  }, [candidates, q, roleMatchedCandidates, showRoleMatchesOnly]);

  async function refreshIngestionState(
    source: 'upload' | 'manual',
    response: {
      createdCount: number;
      skippedCount: number;
    },
    uploadedResumeCount?: number
  ) {
    setLastIntakeSummary({
      source,
      createdCount: response.createdCount,
      skippedCount: response.skippedCount,
      uploadedResumeCount,
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] }),
      queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
    ]);
  }

  async function handleUploadFiles() {
    if (!spreadsheetFile && !resumeZipFile) {
      toast.error('Choose a spreadsheet, a resume ZIP, or both.');
      return;
    }

    setUploading(true);

    try {
      let createdCount = 0;
      let skippedCount = 0;
      let uploadedResumeCount = 0;

      if (spreadsheetFile) {
        const candidateResponse = await uploadCandidatesFile(spreadsheetFile);
        createdCount = candidateResponse.createdCount;
        skippedCount = candidateResponse.skippedCount;
        await refreshIngestionState('upload', candidateResponse);
        setSpreadsheetFile(null);
        if (spreadsheetInputRef.current) {
          spreadsheetInputRef.current.value = '';
        }
      }

      if (resumeZipFile) {
        try {
          const resumeResponse = await uploadResumeZip(resumeZipFile);
          uploadedResumeCount = resumeResponse.uploadedCount;
          setResumeZipFile(null);
          if (resumeZipInputRef.current) {
            resumeZipInputRef.current.value = '';
          }
        } catch (resumeUploadError) {
          if (spreadsheetFile) {
            setLastIntakeSummary({
              source: 'upload',
              createdCount,
              skippedCount,
            });
            toast.error(
              `Applicants were uploaded, but the resume ZIP failed: ${getApiErrorMessage(
                resumeUploadError,
                'Unable to upload the resume ZIP right now.'
              )}`
            );
            return;
          }

          throw resumeUploadError;
        }
      }

      setLastIntakeSummary({
        source: 'upload',
        createdCount,
        skippedCount,
        ...(resumeZipFile ? { uploadedResumeCount } : {}),
      });

      toast.success(
        [
          spreadsheetFile
            ? `${createdCount} candidate${createdCount === 1 ? '' : 's'} added.`
            : null,
          spreadsheetFile && skippedCount > 0
            ? `${skippedCount} duplicate${skippedCount === 1 ? ' was' : 's were'} skipped.`
            : null,
          resumeZipFile
            ? `${uploadedResumeCount} resume PDF${uploadedResumeCount === 1 ? '' : 's'} uploaded.`
            : null,
        ]
          .filter(Boolean)
          .join(' ')
      );
      setTab('pool');
    } catch (uploadError) {
      toast.error(
        getApiErrorMessage(
          uploadError,
          'Unable to upload the selected intake files right now.'
        )
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const jobTitle = (job?.title ?? manualForm.job_title).trim();
    const experience = Number(manualForm.experience_in_years);
    const nextErrors: Partial<Record<keyof ManualCandidateForm, string>> = {};

    if (!manualForm.applicant_name.trim()) {
      nextErrors.applicant_name = 'Candidate name is required';
    }

    if (!jobTitle) {
      nextErrors.job_title = 'Role title is required';
    }

    if (!manualForm.experience_in_years.trim()) {
      nextErrors.experience_in_years = 'Experience is required';
    } else if (!Number.isFinite(experience) || experience < 0) {
      nextErrors.experience_in_years = 'Experience must be a positive number';
    }

    setManualErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted intake fields.');
      return;
    }

    const payload: RegisterCandidateInput[] = [
      {
        applicant_name: manualForm.applicant_name.trim(),
        job_title: jobTitle,
        skills: splitCommaList(manualForm.skills),
        education_certificates: splitCommaList(
          manualForm.education_certificates
        ),
        additional_info: splitCommaList(manualForm.additional_info),
        experience_in_years: experience,
      },
    ];

    setSubmittingManual(true);

    try {
      const response = await registerCandidates(payload);
      await refreshIngestionState('manual', response);
      toast.success(
        [
          `${response.createdCount} candidate${response.createdCount === 1 ? '' : 's'} added.`,
          response.skippedCount > 0
            ? `${response.skippedCount} duplicate${response.skippedCount === 1 ? ' was' : 's were'} skipped.`
            : null,
        ]
          .filter(Boolean)
          .join(' ')
      );
      setManualForm({
        ...initialManualForm,
        job_title: job?.title ?? manualForm.job_title,
      });
      setManualErrors({});
      setTab('pool');
    } catch (manualError) {
      toast.error(
        getApiErrorMessage(
          manualError,
          'Unable to add this candidate right now.'
        )
      );
    } finally {
      setSubmittingManual(false);
    }
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-lg font-semibold">
          Candidate intake is unavailable
        </div>
        <div className="mt-1 text-sm text-text-muted">
          We could not load the current candidate pool from the backend.
        </div>
        <div className="mt-4">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (jobLoading || candidatesLoading) {
    return <ScreeningIntakeSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Applicant Intake"
        subtitle="Review candidate records already in the backend, then upload CSV or Excel files when you need more signal."
        backHref={job ? `/dashboard/jobs/${job.id}` : '/dashboard'}
        right={
          <div className="rounded-badge border border-border bg-bg px-3 py-1 text-xs font-semibold text-text-muted">
            {jobLoading
              ? 'Loading role...'
              : job
                ? `Role: ${job.title}`
                : 'Role unavailable'}
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Current Backend Scope"
              subtitle="This flow is now connected only to the routes your backend already exposes."
            />
            <CardBody className="grid gap-4 md:grid-cols-3">
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <Users className="h-3.5 w-3.5" />
                  Candidates in pool
                </div>
                <div className="mt-2 text-2xl font-bold text-text-primary">
                  {candidatesLoading ? '-' : candidates.length}
                </div>
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <Briefcase className="h-3.5 w-3.5" />
                  Matched to this role
                </div>
                <div className="mt-2 text-2xl font-bold text-text-primary">
                  {candidatesLoading ? '-' : roleMatchedCandidates.length}
                </div>
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <FileUp className="h-3.5 w-3.5" />
                  Intake paths
                </div>
                <div className="mt-2 text-sm font-semibold text-text-primary">
                  CSV, XLSX, or manual form
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className={[
                'rounded-badge border px-4 py-2 text-sm font-semibold',
                tab === 'pool'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-muted hover:bg-bg hover:text-text-primary',
              ].join(' ')}
              onClick={() => setTab('pool')}
              type="button"
            >
              Candidate Pool
            </button>
            <button
              className={[
                'rounded-badge border px-4 py-2 text-sm font-semibold',
                tab === 'upload'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-muted hover:bg-bg hover:text-text-primary',
              ].join(' ')}
              onClick={() => setTab('upload')}
              type="button"
            >
              Upload File
            </button>
            <button
              className={[
                'rounded-badge border px-4 py-2 text-sm font-semibold',
                tab === 'manual'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-muted hover:bg-bg hover:text-text-primary',
              ].join(' ')}
              onClick={() => setTab('manual')}
              type="button"
            >
              Add Manually
            </button>
          </div>

          {tab === 'pool' ? (
            <>
              <Card className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                      className="h-10 w-full rounded-input border border-border bg-surface pl-10 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-accent/30"
                      placeholder="Search by name, role, or skill"
                    />
                  </div>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-input border border-border bg-surface px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
                    onClick={() =>
                      setShowRoleMatchesOnly((current) => !current)
                    }
                    type="button"
                  >
                    <Filter className="h-4 w-4" />
                    {showRoleMatchesOnly
                      ? 'Showing this role only'
                      : 'Showing all candidates'}
                  </button>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredCandidates.map((candidate) => (
                      <Card key={candidate.id} className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">
                              {initials(candidate.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-text-primary">
                                {candidate.name}
                              </div>
                              <div className="truncate text-xs text-text-muted">
                                {candidate.appliedJobTitle ||
                                  candidate.currentTitle}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              candidate.shortlisted ? 'success' : 'default'
                            }
                          >
                            {candidate.shortlisted
                              ? 'Shortlisted'
                              : 'Reviewing'}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {candidate.skills.technical.length > 0 ? (
                            candidate.skills.technical
                              .slice(0, 4)
                              .map((skill) => (
                                <SkillTag key={skill}>{skill}</SkillTag>
                              ))
                          ) : (
                            <div className="text-sm text-text-muted">
                              No skills captured yet.
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-text-muted">
                          <div>
                            {candidate.yearsExperience} years experience
                          </div>
                          <Link
                            className="font-semibold text-accent hover:text-accent-hover"
                            href={`/dashboard/candidates/${candidate.id}`}
                          >
                            Open profile
                          </Link>
                        </div>
                      </Card>
                    ))}
              </div>

              {!candidatesLoading && filteredCandidates.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-sm font-semibold text-text-primary">
                    No candidates match this view yet
                  </div>
                  <div className="mt-1 text-sm text-text-muted">
                    Try searching a broader term, upload a spreadsheet, or add a
                    candidate manually for this role.
                  </div>
                </Card>
              ) : null}
            </>
          ) : tab === 'upload' ? (
            <Card>
              <CardHeader
                title="Upload Applicants and Resume ZIP"
                subtitle="The backend accepts CSV/XLSX applicant imports and an optional ZIP of resume PDFs."
              />
              <CardBody className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-card border-2 border-dashed border-border bg-bg p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="mt-4 text-base font-semibold text-text-primary">
                      Applicant spreadsheet
                    </div>
                    <div className="mt-2 text-sm text-text-muted">
                      Upload the CSV or XLSX file that creates applicant records
                      in the backend.
                    </div>
                    <div className="mt-5">
                      <input
                        ref={spreadsheetInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={(event) =>
                          setSpreadsheetFile(event.target.files?.[0] ?? null)
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() => spreadsheetInputRef.current?.click()}
                        disabled={uploading}
                        type="button"
                      >
                        {spreadsheetFile
                          ? 'Change Spreadsheet'
                          : 'Choose Spreadsheet'}
                      </Button>
                    </div>
                    <div className="mt-3 text-xs text-text-muted">
                      {spreadsheetFile
                        ? spreadsheetFile.name
                        : 'No spreadsheet selected yet.'}
                    </div>
                  </div>

                  <div className="rounded-card border-2 border-dashed border-border bg-bg p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <FileUp className="h-6 w-6" />
                    </div>
                    <div className="mt-4 text-base font-semibold text-text-primary">
                      Resume ZIP
                    </div>
                    <div className="mt-2 text-sm text-text-muted">
                      Upload a `.zip` archive of resume PDFs named after the
                      applicant records already in the system.
                    </div>
                    <div className="mt-5">
                      <input
                        ref={resumeZipInputRef}
                        type="file"
                        accept=".zip,application/zip"
                        className="hidden"
                        onChange={(event) =>
                          setResumeZipFile(event.target.files?.[0] ?? null)
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() => resumeZipInputRef.current?.click()}
                        disabled={uploading}
                        type="button"
                      >
                        {resumeZipFile ? 'Change ZIP File' : 'Choose ZIP File'}
                      </Button>
                    </div>
                    <div className="mt-3 text-xs text-text-muted">
                      {resumeZipFile
                        ? resumeZipFile.name
                        : 'No resume ZIP selected yet.'}
                    </div>
                  </div>
                </div>

                <div className="rounded-card border border-border bg-bg p-4 text-sm text-text-muted">
                  If both files are selected, the spreadsheet uploads first so
                  the backend can match ZIP filenames to applicant names.
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSpreadsheetFile(null);
                      setResumeZipFile(null);
                      if (spreadsheetInputRef.current) {
                        spreadsheetInputRef.current.value = '';
                      }
                      if (resumeZipInputRef.current) {
                        resumeZipInputRef.current.value = '';
                      }
                    }}
                    disabled={uploading}
                    type="button"
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleUploadFiles}
                    disabled={uploading || (!spreadsheetFile && !resumeZipFile)}
                    type="button"
                  >
                    {uploading ? 'Uploading...' : 'Upload Selected Files'}
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-card border border-border bg-bg p-4">
                    <div className="text-sm font-semibold text-text-primary">
                      Best for right now
                    </div>
                    <div className="mt-2 text-sm text-text-muted">
                      Use this when the recruiting team already has a prepared
                      applicant spreadsheet and a ZIP of matching resume PDFs.
                    </div>
                  </div>
                  <div className="rounded-card border border-border bg-bg p-4">
                    <div className="text-sm font-semibold text-text-primary">
                      Recent intake
                    </div>
                    <div className="mt-2 text-sm text-text-muted">
                      {formatIntakeSummary(lastIntakeSummary)}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader
                title="Add Candidate Manually"
                subtitle="Use the backend applicant-registration route without preparing a spreadsheet first."
              />
              <CardBody>
                <form className="space-y-6" onSubmit={handleManualSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-text-primary">
                        Candidate Name
                      </label>
                      <input
                        value={manualForm.applicant_name}
                        onChange={(event) =>
                          setManualForm((current) => ({
                            ...current,
                            applicant_name: event.target.value,
                          }))
                        }
                        className={`${inputClass(Boolean(manualErrors.applicant_name))} h-10`}
                        placeholder="Amina Uwase"
                      />
                      {manualErrors.applicant_name ? (
                        <p className="mt-1.5 text-xs font-medium text-danger">
                          {manualErrors.applicant_name}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-text-primary">
                        Years of Experience
                      </label>
                      <input
                        value={manualForm.experience_in_years}
                        onChange={(event) =>
                          setManualForm((current) => ({
                            ...current,
                            experience_in_years: event.target.value,
                          }))
                        }
                        className={`${inputClass(Boolean(manualErrors.experience_in_years))} h-10`}
                        inputMode="decimal"
                        placeholder="5"
                        type="number"
                      />
                      {manualErrors.experience_in_years ? (
                        <p className="mt-1.5 text-xs font-medium text-danger">
                          {manualErrors.experience_in_years}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {job ? (
                    <div className="rounded-card border border-border bg-bg p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Role Title
                      </div>
                      <div className="mt-1 text-sm font-semibold text-text-primary">
                        {job.title}
                      </div>
                      <div className="mt-2 text-sm text-text-muted">
                        Manual intake on this screen is pinned to the current
                        job so role matching stays reliable.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-semibold text-text-primary">
                        Role Title
                      </label>
                      <input
                        value={manualForm.job_title}
                        onChange={(event) =>
                          setManualForm((current) => ({
                            ...current,
                            job_title: event.target.value,
                          }))
                        }
                        className={`${inputClass(Boolean(manualErrors.job_title))} h-10`}
                        placeholder="Senior Product Designer"
                      />
                      {manualErrors.job_title ? (
                        <p className="mt-1.5 text-xs font-medium text-danger">
                          {manualErrors.job_title}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-text-primary">
                        Skills
                      </label>
                      <textarea
                        value={manualForm.skills}
                        onChange={(event) =>
                          setManualForm((current) => ({
                            ...current,
                            skills: event.target.value,
                          }))
                        }
                        className={`${inputClass()} min-h-[110px] py-2`}
                        placeholder="React, TypeScript, Figma, stakeholder communication"
                      />
                      <div className="mt-1 text-xs text-text-muted">
                        Comma-separated skills are sent directly to the backend
                        intake parser.
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-text-primary">
                        Education or Certifications
                      </label>
                      <textarea
                        value={manualForm.education_certificates}
                        onChange={(event) =>
                          setManualForm((current) => ({
                            ...current,
                            education_certificates: event.target.value,
                          }))
                        }
                        className={`${inputClass()} min-h-[110px] py-2`}
                        placeholder="BSc Computer Science, AWS Certified Developer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-text-primary">
                      Additional Info
                    </label>
                    <textarea
                      value={manualForm.additional_info}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          additional_info: event.target.value,
                        }))
                      }
                      className={`${inputClass()} min-h-[110px] py-2`}
                      placeholder="amina@example.com, linkedin.com/in/aminauwase, strong portfolio feedback"
                    />
                    <div className="mt-1 text-xs text-text-muted">
                      Add email, LinkedIn, or recruiter notes as a
                      comma-separated list.
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-card border border-border bg-bg p-4">
                      <div className="text-sm font-semibold text-text-primary">
                        Best for right now
                      </div>
                      <div className="mt-2 text-sm text-text-muted">
                        This path is ideal when a recruiter wants to add one
                        candidate quickly without leaving the role workflow.
                      </div>
                    </div>
                    <div className="rounded-card border border-border bg-bg p-4">
                      <div className="text-sm font-semibold text-text-primary">
                        Recent intake
                      </div>
                      <div className="mt-2 text-sm text-text-muted">
                        {formatIntakeSummary(lastIntakeSummary)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setManualForm({
                          ...initialManualForm,
                          job_title: job?.title ?? '',
                        });
                        setManualErrors({});
                      }}
                      type="button"
                    >
                      Clear Form
                    </Button>
                    <Button disabled={submittingManual} type="submit">
                      {submittingManual
                        ? 'Adding Candidate...'
                        : 'Add Candidate'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Next Step"
              subtitle="What recruiters can do after intake with the current backend."
            />
            <CardBody className="space-y-4">
              <div className="rounded-card border border-border bg-bg p-4 text-sm text-text-muted">
                Review the imported candidate records, verify the role
                alignment, and decide who should remain in the pool for later
                screening.
              </div>
              {job && canRunScreening ? (
                <Link
                  href={`/dashboard/screening/${job.id}/progress`}
                  className="block"
                >
                  <Button className="w-full">Run AI Screening</Button>
                </Link>
              ) : null}
              {job && !canRunScreening ? (
                <Button className="w-full" disabled>
                  Add matching candidates to start screening
                </Button>
              ) : null}
              {job ? (
                <Link href={`/dashboard/jobs/${job.id}`} className="block">
                  <Button className="w-full" variant="outline">
                    Return to Job Brief
                  </Button>
                </Link>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Intake Tips"
              subtitle="A few habits that keep the pipeline clean."
            />
            <CardBody className="space-y-3 text-sm text-text-muted">
              <div className="rounded-card border border-border bg-bg p-4">
                Use the exact job title from the brief so candidates can be
                grouped correctly.
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                Keep skill lists concise; longer recruiter notes work better in
                additional info.
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                Re-intaking the same candidate for the same role will be skipped
                automatically.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
