import axios, { type AxiosInstance } from 'axios';
import {
  mockCandidates,
  mockCandidateScores,
  mockDashboardStats,
  mockJobs,
} from '@/lib/mockData';
import type {
  Candidate,
  CandidateScore,
  DashboardStats,
  Job,
  ScreeningAnalysis,
  ScreeningCandidateAnalysis,
} from '@/types';
import { dashboardStatsSchema } from '@/types';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'mock://local';
const DEFAULT_API_TIMEOUT_MS = 15_000;
const AI_REQUEST_TIMEOUT_MS = 60_000;
const RESUME_UPLOAD_TIMEOUT_MS = 10 * 60_000;
const SCREENING_RUN_TIMEOUT_MS = 10 * 60_000;

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_API_TIMEOUT_MS,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

type MockResponse<T> = { data: T };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isVerified?: boolean;
  createdAtISO?: string;
  updatedAtISO?: string;
};

export type DashboardOverview = {
  applicants: Candidate[];
  jobs: Job[];
  stats: DashboardStats;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type LoginPayload = {
  user_email: string;
  user_pass: string;
};

export type SignupPayload = {
  user_name: string;
  user_email: string;
  user_pass: string;
  user_pass_conf: string;
};

export type CompleteJobPayload = {
  reqBody: {
    job_title: string;
    job_department: string;
    job_location: string;
    job_employment_type: string;
    job_salary_min?: number;
    job_salary_max?: number;
    job_experience_required: string;
    job_description: string;
    job_responsibilities: string;
    job_qualifications: string;
    job_shortlist_size: 10 | 20;
    job_ai_criteria: Array<{
      criteria_string: string;
      description: string;
      priority: string;
    }>;
    workers_required: number;
    job_state?: string;
  };
};

export type RegisterCandidateInput = {
  applicant_name: string;
  job_title: string;
  skills: string[] | string;
  education_certificates: string[] | string;
  additional_info?: string[] | string;
  experience_in_years: number;
};

export type ReviewCandidateDecision = {
  applicant_id?: string;
  applicant_name?: string;
  job_title?: string;
  shortlisted: boolean;
};

export type ScreeningRunSummary = {
  _id: string;
  job_id: string;
  job_title: string;
  applicant_ids: string[];
  topK: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
  model?: string;
  started_at?: string | null;
  completed_at?: string | null;
  result_count?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ScreeningResultApiRecord = {
  _id?: string;
  screening_id: string;
  screening_run_id: string;
  candidate_id: string;
  applicant_id: string;
  job_id: string;
  evaluated_at: string;
  overall: {
    score: number;
    grade: string;
    verdict: 'Shortlisted' | 'Review' | 'Rejected';
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
  strengths: string[];
  gaps: string[];
  recommendation: string;
};

export type LatestJobResultsResponse = {
  run: ScreeningRunSummary;
  results: ScreeningResultApiRecord[];
};

export type CandidateLatestScreening = {
  jobId: string;
  jobTitle: string;
  generatedAtISO: string;
  result: ScreeningResultApiRecord;
};

export type AssistantReply = {
  answer: string;
  suggestedNextQuestions: string[];
  context: {
    jobId: string | null;
    applicantCount: number;
  };
};

export type WorkspaceNotification = {
  id: string;
  title: string;
  body: string;
  createdAtISO: string;
  href?: string;
};

type LoginResponse = {
  success: string;
  user?: AuthUser;
};

type SignupResponse = {
  success: string;
  verificationRequired?: boolean;
  user?: AuthUser;
  devOtpToken?: string;
};

type ConfirmResponse = {
  success: string;
  user?: AuthUser;
};

type ForgotPasswordResponse = {
  success: string;
  devResetToken?: string;
};

type VerifyResetCodeResponse = {
  success: string;
};

type ResetPasswordResponse = {
  success: string;
};

type LogoutResponse = {
  success: string;
};

type CompleteJobResponse = {
  success: string;
  job?: Job;
};

type DashboardResponse = DashboardOverview;
type JobsResponse = { jobs: Job[]; pagination?: PaginationMeta };
type JobResponse = { job: Job };
type CandidatesResponse = { candidates: Candidate[]; pagination?: PaginationMeta };
type CandidateResponse = { candidate: Candidate };
type CurrentUserResponse = { user: AuthUser };
type RegisterCandidatesResponse = {
  success: string;
  createdCount: number;
  skippedCount: number;
  applicants: Candidate[];
};

type ResumeUploadResponse = {
  success: string;
  uploadedCount: number;
  applicants: string[];
  unmatchedCount?: number;
  unmatchedFiles?: string[];
  failedCount?: number;
  failedFiles?: string[];
};

type ScreeningRunApiResult = {
  applicant_id?: string;
  applicant_name?: string;
  applicant_marks?: number;
  applicant_specification_relevance?: {
    skills_relevance?: number;
    education_relevance?: number;
  };
  applicant_result_description?: string;
};

type ScreeningRunResponse = {
  success: {
    job_title?: string;
    applicants_details?: ScreeningRunApiResult[];
    result_verdict?: string;
  };
};

type ReviewResultResponse = {
  success: string;
  updatedCount: number;
};

type ScreeningRunsResponse = {
  runs: ScreeningRunSummary[];
  pagination?: PaginationMeta;
};

type LatestJobResultsApiResponse = LatestJobResultsResponse & {
  pagination?: PaginationMeta;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const BULK_FETCH_PAGE_SIZE = 100;
const MAX_PAGINATION_REQUESTS = 100;

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const truncated = Math.trunc(parsed);
  return truncated > 0 ? truncated : fallback;
}

function buildFallbackPagination(
  itemCount: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalItems = Math.max(itemCount, 0);
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: totalItems > 0 && page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function normalizeCandidateList(value: string[] | string | undefined) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMockCandidate(
  input: RegisterCandidateInput,
  index: number
): Candidate {
  const createdAtISO = new Date().toISOString();
  const additionalInfo = normalizeCandidateList(input.additional_info);
  const email = additionalInfo.find((item) => /\S+@\S+\.\S+/.test(item));
  const linkedIn = additionalInfo.find((item) =>
    item.toLowerCase().includes('linkedin')
  );

  return {
    id: `mock-candidate-${Date.now()}-${index}`,
    name: input.applicant_name,
    currentTitle: input.job_title,
    location: 'Location not provided',
    yearsExperience: input.experience_in_years,
    email,
    linkedIn,
    shortlisted: false,
    appliedJobId:
      mockJobs.find((job) => normalizeText(job.title) === normalizeText(input.job_title))
        ?.id ?? undefined,
    appliedJobTitle: input.job_title,
    createdAtISO,
    updatedAtISO: createdAtISO,
    skills: {
      technical: normalizeCandidateList(input.skills),
      soft: additionalInfo.filter(
        (item) => item !== email && item !== linkedIn
      ),
    },
    education: normalizeCandidateList(input.education_certificates),
    workHistory: [],
  };
}

function clampPercentage(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function normalizeDate(value: string | number | Date | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function normalizeScreeningApplicant(
  applicant: ScreeningRunApiResult
): ScreeningCandidateAnalysis {
  return {
    candidateId: applicant.applicant_id?.trim() || undefined,
    candidateName: applicant.applicant_name?.trim() || 'Unnamed candidate',
    score: clampPercentage(applicant.applicant_marks),
    skillsMatchPct: clampPercentage(
      applicant.applicant_specification_relevance?.skills_relevance
    ),
    educationPct: clampPercentage(
      applicant.applicant_specification_relevance?.education_relevance
    ),
    reasoning:
      applicant.applicant_result_description?.trim() ||
      'Screening summary unavailable.',
  };
}

function buildMockScreeningAnalysis(jobId: string): ScreeningAnalysis {
  const job = mockJobs.find((item) => item.id === jobId);

  return {
    jobId,
    jobTitle: job?.title ?? 'Candidate screening',
    verdict: 'Top candidates shortlisted based on the mock screening dataset.',
    generatedAtISO: new Date().toISOString(),
    applicants: mockCandidateScores
      .filter((item) => item.jobId === jobId)
      .map((item) => ({
        candidateId: item.candidateId,
        candidateName:
          mockCandidates.find((candidate) => candidate.id === item.candidateId)
            ?.name ?? 'Candidate',
        score: item.score,
        skillsMatchPct: item.skillsMatchPct,
        educationPct: item.educationPct,
        reasoning: item.reasoning,
      })),
  };
}

function buildMockLatestJobResults(jobId: string): LatestJobResultsResponse | null {
  const job = mockJobs.find((item) => item.id === jobId);
  if (!job) {
    return null;
  }

  const generatedAtISO = new Date().toISOString();
  const rankedScores = mockCandidateScores
    .filter((item) => item.jobId === jobId)
    .sort((left, right) => right.score - left.score);

  return {
    run: {
      _id: `mock-run-${jobId}`,
      job_id: jobId,
      job_title: job.title,
      applicant_ids: rankedScores.map((item) => item.candidateId),
      topK: job.aiCriteria.shortlistSize,
      status: 'completed',
      started_at: generatedAtISO,
      completed_at: generatedAtISO,
      result_count: rankedScores.length,
      createdAt: generatedAtISO,
      updatedAt: generatedAtISO,
    },
    results: rankedScores.map((score, index) => ({
      _id: `mock-result-${jobId}-${score.candidateId}`,
      screening_id: `mock-screening-${jobId}-${score.candidateId}`,
      screening_run_id: `mock-run-${jobId}`,
      candidate_id: score.candidateId,
      applicant_id: score.candidateId,
      job_id: jobId,
      evaluated_at: generatedAtISO,
      overall: {
        score: score.score,
        grade:
          score.score >= 85
            ? 'A'
            : score.score >= 70
              ? 'B'
              : score.score >= 55
                ? 'C'
                : 'D',
        verdict:
          score.score >= 80
            ? 'Shortlisted'
            : score.score >= 60
              ? 'Review'
              : 'Rejected',
        summary: score.reasoning,
      },
      dimension_scores: {
        skills_match: {
          score: score.skillsMatchPct,
          matched: score.strengths,
          missing: score.gaps,
          reasoning: score.reasoning,
        },
        experience_relevance: {
          score: score.experiencePct,
          total_years:
            mockCandidates.find((candidate) => candidate.id === score.candidateId)
              ?.yearsExperience ?? 0,
          relevant_years:
            mockCandidates.find((candidate) => candidate.id === score.candidateId)
              ?.yearsExperience ?? 0,
          highlights: [],
          reasoning: score.reasoning,
        },
        education_fit: {
          score: score.educationPct,
          degree_level: 'Not specified',
          field_relevance: 'Medium',
          reasoning: score.reasoning,
        },
        project_quality: {
          score: score.overallRelevancePct,
          count: 0,
          highlights: [],
          reasoning: score.reasoning,
        },
        certifications_value: {
          score: score.overallRelevancePct,
          count: 0,
          relevant: [],
          reasoning: score.reasoning,
        },
        language_fit: {
          score: 95,
          required_met: true,
          languages: [{ name: 'English', proficiency: 'Fluent' }],
        },
        availability_fit: {
          score: 100,
          status: 'Available',
          type_match: true,
          earliest_start: generatedAtISO,
        },
      },
      weights_used: {
        skills_match: 0.3,
        experience_relevance: 0.25,
        project_quality: 0.15,
        education_fit: 0.1,
        certifications_value: 0.1,
        language_fit: 0.05,
        availability_fit: 0.05,
      },
      flags: {
        career_gap: false,
        overqualified: false,
        location_mismatch: false,
        incomplete_profile: false,
      },
      rank: index + 1,
      percentile: Math.max(1, Math.round(((rankedScores.length - index) / rankedScores.length) * 100)),
      strengths: score.strengths,
      gaps: score.gaps,
      recommendation:
        score.score >= 80
          ? 'Strong shortlist candidate'
          : score.score >= 60
            ? 'Worth recruiter review'
            : 'Not recommended for the first shortlist',
    })),
  };
}

async function mockGet<T>(path: string): Promise<MockResponse<T>> {
  await sleep(450);

  const dashboardPayload: DashboardOverview = {
    applicants: mockCandidates,
    jobs: mockJobs,
    stats: mockDashboardStats,
  };

  if (path === '/dashboard') {
    return { data: dashboardPayload as unknown as T };
  }

  if (path === '/jobs') {
    return { data: { jobs: mockJobs } as unknown as T };
  }

  if (path.startsWith('/jobs/')) {
    const id = path.split('/')[2] ?? '';
    const job = mockJobs.find((item) => item.id === id);
    if (!job) {
      throw new Error('Job not found');
    }

    return { data: { job } as unknown as T };
  }

  if (path === '/candidates') {
    return { data: { candidates: mockCandidates } as unknown as T };
  }

  if (path.startsWith('/candidates/')) {
    const id = path.split('/')[2] ?? '';
    const candidate = mockCandidates.find((item) => item.id === id);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return { data: { candidate } as unknown as T };
  }

  if (path === '/auth/me') {
    return {
      data: {
        user: {
          id: 'demo-user',
          name: 'A. Recruiter',
          email: 'recruiter@talvo.ai',
          isVerified: true,
        },
      } as unknown as T,
    };
  }

  throw new Error(`No mock handler for GET ${path}`);
}

export function isMockMode() {
  return baseURL.startsWith('mock://');
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong'
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      const knownKeys = [
        'message',
        'success',
        'input_error',
        'auth_error',
        'data_error',
        'server_error',
        'error',
        'user_error',
        'expired_error',
        'expiration_error',
        'ai_error',
      ] as const;

      for (const key of knownKeys) {
        const value = (data as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (isMockMode()) {
    const response = await mockGet<DashboardResponse>('/dashboard');
    return {
      applicants: response.data.applicants,
      jobs: response.data.jobs,
      stats: dashboardStatsSchema.parse(response.data.stats),
    };
  }

  const response = await api.get<DashboardResponse>('/dashboard');
  return {
    applicants: response.data.applicants,
    jobs: response.data.jobs,
    stats: dashboardStatsSchema.parse(response.data.stats),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const overview = await getDashboardOverview();
  return overview.stats;
}

export async function getJobs(): Promise<Job[]> {
  if (isMockMode()) {
    return mockJobs;
  }

  const jobs: Job[] = [];
  let page = 1;

  for (
    let requestCount = 0;
    requestCount < MAX_PAGINATION_REQUESTS;
    requestCount += 1
  ) {
    const response = await api.get<JobsResponse>('/jobs', {
      params: {
        page,
        pageSize: BULK_FETCH_PAGE_SIZE,
      },
    });
    jobs.push(...response.data.jobs);

    const pagination =
      response.data.pagination ??
      buildFallbackPagination(response.data.jobs.length, page, BULK_FETCH_PAGE_SIZE);

    if (!pagination.hasNextPage || page >= pagination.totalPages) {
      break;
    }

    page += 1;
  }

  return jobs;
}

export async function getJob(id: string): Promise<Job> {
  if (isMockMode()) {
    const response = await mockGet<JobResponse>(`/jobs/${id}`);
    return response.data.job;
  }

  const response = await api.get<JobResponse>(`/jobs/${id}`);
  return response.data.job;
}

export async function getCandidates(): Promise<Candidate[]> {
  if (isMockMode()) {
    return mockCandidates;
  }

  const candidates: Candidate[] = [];
  let page = 1;

  for (
    let requestCount = 0;
    requestCount < MAX_PAGINATION_REQUESTS;
    requestCount += 1
  ) {
    const response = await api.get<CandidatesResponse>('/candidates', {
      params: {
        page,
        pageSize: BULK_FETCH_PAGE_SIZE,
      },
    });
    candidates.push(...response.data.candidates);

    const pagination =
      response.data.pagination ??
      buildFallbackPagination(
        response.data.candidates.length,
        page,
        BULK_FETCH_PAGE_SIZE
      );

    if (!pagination.hasNextPage || page >= pagination.totalPages) {
      break;
    }

    page += 1;
  }

  return candidates;
}

export async function getCandidate(id: string): Promise<Candidate> {
  if (isMockMode()) {
    const response = await mockGet<CandidateResponse>(`/candidates/${id}`);
    return response.data.candidate;
  }

  const response = await api.get<CandidateResponse>(`/candidates/${id}`);
  return response.data.candidate;
}

export async function getLatestJobResults(
  jobId: string
): Promise<LatestJobResultsResponse | null> {
  if (isMockMode()) {
    return buildMockLatestJobResults(jobId);
  }

  const aggregatedResults: ScreeningResultApiRecord[] = [];
  let runSummary: ScreeningRunSummary | null = null;
  let page = 1;

  for (
    let requestCount = 0;
    requestCount < MAX_PAGINATION_REQUESTS;
    requestCount += 1
  ) {
    let response;
    try {
      response = await api.get<LatestJobResultsApiResponse>(
        `/ai/jobs/${jobId}/results`,
        {
          params: {
            page,
            pageSize: BULK_FETCH_PAGE_SIZE,
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw error;
    }

    if (!runSummary) {
      runSummary = response.data.run;
    }
    aggregatedResults.push(...response.data.results);

    const pagination =
      response.data.pagination ??
      buildFallbackPagination(
        response.data.results.length,
        page,
        BULK_FETCH_PAGE_SIZE
      );

    if (!pagination.hasNextPage || page >= pagination.totalPages) {
      break;
    }

    page += 1;
  }

  if (!runSummary) {
    return null;
  }

  return {
    run: runSummary,
    results: aggregatedResults,
  };
}

export async function getScreeningRuns(
  jobId?: string
): Promise<ScreeningRunSummary[]> {
  if (isMockMode()) {
    const results = jobId ? buildMockLatestJobResults(jobId) : null;
    return results ? [results.run] : [];
  }

  const runs: ScreeningRunSummary[] = [];
  let page = 1;

  for (
    let requestCount = 0;
    requestCount < MAX_PAGINATION_REQUESTS;
    requestCount += 1
  ) {
    const response = await api.get<ScreeningRunsResponse>('/ai/runs', {
      params: {
        ...(jobId ? { jobId } : {}),
        page,
        pageSize: BULK_FETCH_PAGE_SIZE,
      },
    });
    runs.push(...response.data.runs);

    const pagination =
      response.data.pagination ??
      buildFallbackPagination(response.data.runs.length, page, BULK_FETCH_PAGE_SIZE);

    if (!pagination.hasNextPage || page >= pagination.totalPages) {
      break;
    }

    page += 1;
  }

  return runs;
}

export async function getWorkspaceScreeningIndex(jobIds: string[]) {
  const uniqueJobIds = Array.from(new Set(jobIds.filter(Boolean)));
  const latestByCandidate: Record<string, ScreeningResultApiRecord> = {};

  const jobResults = await Promise.all(
    uniqueJobIds.map(async (jobId) => {
      try {
        return await getLatestJobResults(jobId);
      } catch {
        return null;
      }
    })
  );

  for (const item of jobResults) {
    if (!item) {
      continue;
    }

    for (const result of item.results) {
      latestByCandidate[result.candidate_id] = result;
      latestByCandidate[result.applicant_id] = result;
    }
  }

  return latestByCandidate;
}

export async function getScreeningResults(
  jobId: string
): Promise<CandidateScore[]> {
  if (isMockMode()) {
    return mockCandidateScores.filter((item) => item.jobId === jobId);
  }

  const latestResults = await getLatestJobResults(jobId);
  if (!latestResults) {
    return [];
  }

  return latestResults.results.map((result) => ({
    candidateId: result.candidate_id,
    jobId,
    score: result.overall.score,
    skillsMatchPct: result.dimension_scores.skills_match.score,
    experiencePct: result.dimension_scores.experience_relevance.score,
    educationPct: result.dimension_scores.education_fit.score,
    overallRelevancePct: result.overall.score,
    reasoning: result.overall.summary,
    strengths: result.strengths,
    gaps: result.gaps,
    screenedAtISO: normalizeDate(result.evaluated_at),
  }));
}

export async function getCurrentUser(): Promise<AuthUser> {
  if (isMockMode()) {
    const response = await mockGet<CurrentUserResponse>('/auth/me');
    return response.data.user;
  }

  const response = await api.get<CurrentUserResponse>('/auth/me');
  return response.data.user;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function signupUser(
  payload: SignupPayload
): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>('/auth/signup', payload);
  return response.data;
}

export async function confirmSignup(
  token: string,
  signupToken?: string
): Promise<ConfirmResponse> {
  const response = await api.post<ConfirmResponse>('/auth/confirm', {
    token,
    ...(signupToken ? { signup_token: signupToken } : {}),
  });
  return response.data;
}

export async function confirmSignupWithLink(
  confirmationLinkId: string,
  signupToken?: string
): Promise<ConfirmResponse> {
  const response = await api.get<ConfirmResponse>(
    `/auth/confirm_link/${encodeURIComponent(confirmationLinkId)}`,
    {
      params: signupToken ? { signup_token: signupToken } : undefined,
    }
  );
  return response.data;
}

export async function forgotPassword(
  user_email: string
): Promise<ForgotPasswordResponse> {
  if (isMockMode()) {
    await sleep(450);
    return {
      success: 'Reset code generated successfully',
      devResetToken: '123456',
    };
  }

  const response = await api.post<ForgotPasswordResponse>('/auth/forgot', {
    user_email,
  });
  return response.data;
}

export async function verifyResetCode(
  token: string,
  recoveryToken?: string
): Promise<VerifyResetCodeResponse> {
  if (isMockMode()) {
    await sleep(350);
    return { success: 'Token verification successful' };
  }

  const response = await api.post<VerifyResetCodeResponse>('/auth/verify', {
    token,
    ...(recoveryToken ? { recovery_token: recoveryToken } : {}),
  });
  return response.data;
}

export async function resetPassword(payload: {
  user_pass: string;
  user_pass_conf: string;
}): Promise<ResetPasswordResponse> {
  if (isMockMode()) {
    await sleep(350);
    return { success: 'Password reset successful' };
  }

  const response = await api.post<ResetPasswordResponse>(
    '/auth/reset',
    payload
  );
  return response.data;
}

export async function logoutUser(): Promise<LogoutResponse> {
  if (isMockMode()) {
    return { success: 'Logged out successfully' };
  }

  const response = await api.post<LogoutResponse>('/auth/logout');
  return response.data;
}

export async function createJob(
  payload: CompleteJobPayload
): Promise<CompleteJobResponse> {
  const response = await api.post<CompleteJobResponse>(
    '/complete-job',
    payload
  );
  return response.data;
}

export async function uploadCandidatesFile(
  file: File,
  defaults?: { jobId?: string; jobTitle?: string }
): Promise<RegisterCandidatesResponse> {
  if (isMockMode()) {
    await sleep(450);
    return {
      success: 'Applicants processed successfully',
      createdCount: 0,
      skippedCount: 0,
      applicants: mockCandidates,
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  if (defaults?.jobId) {
    formData.append('default_job_id', defaults.jobId);
  }
  if (defaults?.jobTitle) {
    formData.append('default_job_title', defaults.jobTitle);
  }

  const response = await api.post<RegisterCandidatesResponse>(
    '/register-candidates',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function uploadResumeZip(
  file: File,
  defaults?: { jobId?: string; jobTitle?: string }
): Promise<ResumeUploadResponse> {
  if (isMockMode()) {
    await sleep(450);
    return {
      success: 'Successfully uploaded resume PDFs',
      uploadedCount: 1,
      applicants: ['Mock Applicant'],
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  if (defaults?.jobId) {
    formData.append('default_job_id', defaults.jobId);
  }
  if (defaults?.jobTitle) {
    formData.append('default_job_title', defaults.jobTitle);
  }

  const response = await api.post<ResumeUploadResponse>('/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: RESUME_UPLOAD_TIMEOUT_MS,
  });

  return response.data;
}

export async function registerCandidates(
  applicants: RegisterCandidateInput[]
): Promise<RegisterCandidatesResponse> {
  if (isMockMode()) {
    await sleep(450);
    return {
      success: 'Applicants processed successfully',
      createdCount: applicants.length,
      skippedCount: 0,
      applicants: applicants.map(buildMockCandidate),
    };
  }

  const response = await api.post<RegisterCandidatesResponse>(
    '/register-candidates',
    applicants,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export async function reviewCandidateDecisions(
  verdicts: ReviewCandidateDecision[]
): Promise<ReviewResultResponse> {
  if (isMockMode()) {
    await sleep(250);
    return {
      success: 'Review decisions saved successfully',
      updatedCount: verdicts.length,
    };
  }

  const response = await api.post<ReviewResultResponse>('/review-result', {
    verdict_string: verdicts,
  });
  return response.data;
}

export async function runScreening(
  jobId: string,
  jobTitle: string
): Promise<ScreeningAnalysis> {
  if (isMockMode()) {
    return buildMockScreeningAnalysis(jobId);
  }

  const response = await api.post<ScreeningRunResponse>('/ask', {
    jobId,
    jobTitle,
  }, {
    timeout: SCREENING_RUN_TIMEOUT_MS,
  });
  const result = response.data.success;

  return {
    jobId,
    jobTitle: result.job_title?.trim() || jobTitle,
    verdict:
      result.result_verdict?.trim() || 'Screening completed successfully',
    generatedAtISO: new Date().toISOString(),
    applicants: (result.applicants_details ?? []).map(
      normalizeScreeningApplicant
    ),
  };
}

export async function askAssistantQuestion(input: {
  question: string;
  jobId?: string;
  applicantIds?: string[];
  maxApplicants?: number;
}): Promise<AssistantReply> {
  if (isMockMode()) {
    await sleep(350);
    const job = input.jobId
      ? mockJobs.find((item) => item.id === input.jobId)
      : undefined;

    return {
      answer: job
        ? `Using the mock workspace, ${job.title} currently has ${job.applicantsCount} applicants and a shortlist target of ${job.aiCriteria.shortlistSize}.`
        : `Using the mock workspace, you currently have ${mockJobs.length} jobs and ${mockCandidates.length} candidates loaded.`,
      suggestedNextQuestions: [
        'Who are the strongest candidates right now?',
        'What gaps should I look at before shortlisting?',
      ],
      context: {
        jobId: input.jobId ?? null,
        applicantCount: mockCandidates.length,
      },
    };
  }

  const response = await api.post<AssistantReply>('/ai/ask', {
    question: input.question,
    ...(input.jobId ? { job_id: input.jobId, jobId: input.jobId } : {}),
    ...(input.applicantIds?.length ? { applicantIds: input.applicantIds } : {}),
    ...(typeof input.maxApplicants === 'number'
      ? { maxApplicants: input.maxApplicants }
      : {}),
  }, {
    timeout: AI_REQUEST_TIMEOUT_MS,
  });

  return response.data;
}

export async function getCandidateLatestScreening(
  candidate: Candidate
): Promise<CandidateLatestScreening | null> {
  let jobId = candidate.appliedJobId;
  let jobTitle = candidate.appliedJobTitle || candidate.currentTitle || 'Role';

  if (!jobId && candidate.appliedJobTitle) {
    const jobs = await getJobs();
    const matchedJob = jobs.find(
      (job) => normalizeText(job.title) === normalizeText(candidate.appliedJobTitle)
    );
    jobId = matchedJob?.id;
    jobTitle = matchedJob?.title ?? jobTitle;
  }

  if (!jobId) {
    return null;
  }

  const latestResults = await getLatestJobResults(jobId);
  if (!latestResults) {
    return null;
  }

  const result =
    latestResults.results.find(
      (item) =>
        item.candidate_id === candidate.id || item.applicant_id === candidate.id
    ) ?? null;

  if (!result) {
    return null;
  }

  return {
    jobId,
    jobTitle: latestResults.run.job_title || jobTitle,
    generatedAtISO: normalizeDate(
      latestResults.run.completed_at ||
        latestResults.run.updatedAt ||
        latestResults.run.createdAt
    ),
    result,
  };
}

export async function getWorkspaceNotifications(): Promise<WorkspaceNotification[]> {
  if (isMockMode()) {
    const latestMockJob = mockJobs[0];
    return [
      {
        id: 'mock-screening-ready',
        title: 'Screening ready for review',
        body: `Mock screening results are available for ${latestMockJob?.title ?? 'your role'}.`,
        createdAtISO: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        href: latestMockJob
          ? `/dashboard/screening/${latestMockJob.id}/results`
          : '/dashboard',
      },
      {
        id: 'mock-candidate-pool',
        title: 'Candidate pool updated',
        body: `${mockCandidates.length} mock candidates are currently loaded in the workspace.`,
        createdAtISO: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        href: '/dashboard/candidates',
      },
    ];
  }

  const [overview, runs] = await Promise.all([
    getDashboardOverview(),
    getScreeningRuns().catch(() => []),
  ]);

  const notifications: WorkspaceNotification[] = [];
  const latestRun = runs[0];

  if (latestRun) {
    const href =
      latestRun.status === 'completed'
        ? `/dashboard/screening/${latestRun.job_id}/results`
        : `/dashboard/screening/${latestRun.job_id}/progress`;

    notifications.push({
      id: `screening-${latestRun._id}`,
      title:
        latestRun.status === 'completed'
          ? 'Screening ready for review'
          : latestRun.status === 'failed'
            ? 'Screening run needs attention'
            : 'Screening is in progress',
      body:
        latestRun.status === 'completed'
          ? `${latestRun.job_title} has fresh screening results ready for recruiter review.`
          : latestRun.status === 'failed'
            ? `${latestRun.job_title} hit an issue during screening${latestRun.error ? `: ${latestRun.error}` : '.'}`
            : `${latestRun.job_title} is currently being analyzed by Talvo AI.`,
      createdAtISO: normalizeDate(
        latestRun.completed_at ||
          latestRun.updatedAt ||
          latestRun.started_at ||
          latestRun.createdAt
      ),
      href,
    });
  }

  if (overview.applicants.length > 0) {
    const latestApplicant = [...overview.applicants].sort((left, right) => {
      return (
        new Date(right.updatedAtISO || right.createdAtISO || 0).getTime() -
        new Date(left.updatedAtISO || left.createdAtISO || 0).getTime()
      );
    })[0];

    if (latestApplicant) {
      notifications.push({
        id: `candidate-${latestApplicant.id}`,
        title: 'Candidate pool updated',
        body: `${overview.applicants.length} candidates are currently in the workspace. ${latestApplicant.name} is one of the most recent records.`,
        createdAtISO: normalizeDate(
          latestApplicant.updatedAtISO || latestApplicant.createdAtISO
        ),
        href: '/dashboard/candidates',
      });
    }
  }

  const draftJob = overview.jobs.find((job) => job.status === 'Draft');
  if (draftJob) {
    notifications.push({
      id: `draft-${draftJob.id}`,
      title: 'Draft role needs review',
      body: `${draftJob.title} is still in draft. Finish the brief when you are ready to screen candidates.`,
      createdAtISO: normalizeDate(draftJob.updatedAtISO),
      href: `/dashboard/jobs/${draftJob.id}`,
    });
  }

  return notifications.sort(
    (left, right) =>
      new Date(right.createdAtISO).getTime() -
      new Date(left.createdAtISO).getTime()
  );
}
