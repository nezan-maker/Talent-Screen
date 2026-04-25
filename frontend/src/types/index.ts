import { z } from 'zod';

export type JobStatus = 'Draft' | 'Active' | 'Screening' | 'Complete';

export interface Trend {
  label: string;
  value: string;
  direction: 'up' | 'down' | 'neutral';
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities: string;
  qualifications: string;
  aiCriteria: {
    mustHaveSkills: string;
    niceToHaveSkills: string;
    screeningQuestions: string;
    dealBreakers: string;
    shortlistSize: 10 | 20;
  };
  status: JobStatus;
  applicantsCount: number;
  shortlistedCount: number;
  updatedAtISO: string;
}

export interface Candidate {
  id: string;
  name: string;
  currentTitle: string;
  company?: string;
  location: string;
  yearsExperience: number;
  email?: string;
  linkedIn?: string;
  shortlisted?: boolean;
  appliedJobId?: string;
  appliedJobTitle?: string;
  createdAtISO?: string;
  updatedAtISO?: string;
  skills: {
    technical: string[];
    soft: string[];
  };
  education: string[];
  workHistory: Array<{
    role: string;
    company: string;
    startISO: string;
    endISO?: string;
    highlights: string[];
  }>;
}

export type ScoreBucket = 'qualified' | 'maybe' | 'notQualified';

export interface CandidateScore {
  candidateId: string;
  jobId: string;
  score: number; // 0-100
  skillsMatchPct: number; // 0-100
  experiencePct: number; // 0-100
  educationPct: number; // 0-100
  overallRelevancePct: number; // 0-100
  reasoning: string;
  strengths: string[];
  gaps: string[];
  screenedAtISO: string;
}

export interface ScreeningCandidateAnalysis {
  candidateId?: string;
  candidateName: string;
  score: number;
  skillsMatchPct: number;
  educationPct: number;
  reasoning: string;
}

export interface ScreeningAnalysis {
  jobId: string;
  jobTitle: string;
  verdict: string;
  generatedAtISO: string;
  applicants: ScreeningCandidateAnalysis[];
}

export interface DashboardStats {
  activeJobs: { value: number; trend: Trend };
  totalApplicants: { value: number; trend: Trend };
  shortlisted: { value: number; trend: Trend; conversionRatePct: number };
  inScreening: { value: number; trend: Trend; avgTimePerCandidateMins: number };
}

export interface UiState {
  sidebarCollapsed: boolean;
  isGlobalLoading: boolean;
}

// Zod schemas for runtime validation
export const trendSchema = z.object({
  label: z.string(),
  value: z.string(),
  direction: z.enum(['up', 'down', 'neutral']),
});

export const dashboardStatsSchema = z.object({
  activeJobs: z.object({ value: z.number(), trend: trendSchema }),
  totalApplicants: z.object({ value: z.number(), trend: trendSchema }),
  shortlisted: z.object({
    value: z.number(),
    trend: trendSchema,
    conversionRatePct: z.number(),
  }),
  inScreening: z.object({
    value: z.number(),
    trend: trendSchema,
    avgTimePerCandidateMins: z.number(),
  }),
});
