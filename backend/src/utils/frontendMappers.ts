import {
  extractHeadlineFromExperience,
  getDisplayName,
  inferExperienceYears,
  normalizeEducation,
  normalizeExperience,
  normalizeSkills,
  normalizeSocialLinks,
  parseJobCriteria,
  splitList,
  trimText,
} from "./talentProfile.js";

type FrontendTrend = {
  label: string;
  value: string;
  direction: "up" | "down" | "neutral";
};

type FrontendDashboardStats = {
  activeJobs: { value: number; trend: FrontendTrend };
  totalApplicants: { value: number; trend: FrontendTrend };
  shortlisted: {
    value: number;
    trend: FrontendTrend;
    conversionRatePct: number;
  };
  inScreening: {
    value: number;
    trend: FrontendTrend;
    avgTimePerCandidateMins: number;
  };
};

type FrontendCandidate = {
  id: string;
  name: string;
  currentTitle: string;
  company?: string | undefined;
  location: string;
  yearsExperience: number;
  email?: string | undefined;
  linkedIn?: string | undefined;
  resumeParsed?: boolean | undefined;
  shortlisted: boolean;
  appliedJobId?: string | undefined;
  appliedJobTitle: string;
  createdAtISO?: string | undefined;
  updatedAtISO?: string | undefined;
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
};

type FrontendJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  workersRequired: number;
  minimumMarks: number;
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
  status: "Draft" | "Active" | "Screening" | "Complete";
  applicantsCount: number;
  shortlistedCount: number;
  updatedAtISO: string;
};

type FrontendUser = {
  id: string;
  name: string;
  email: string;
  companyName: string;
  authProvider: string;
  isVerified: boolean;
  onboardingCompleted: boolean;
  onboardingPreferences?: {
    hiringFocus?: string;
    teamSetup?: string;
    workflowGoal?: string;
  };
  createdAtISO?: string | undefined;
  updatedAtISO?: string | undefined;
};

function toId(value: unknown) {
  return trimText(value);
}

function toIso(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function inferLocation(value: unknown) {
  return trimText(value) || "Location not provided";
}

function neutralTrend(label: string): FrontendTrend {
  return {
    label,
    value: "No change",
    direction: "neutral",
  };
}

function toTimestamp(value: unknown) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function computeAverageHireTimeMinutes(applicants: FrontendCandidate[]) {
  const finalizedApplicants = applicants.filter((candidate) => candidate.shortlisted);
  const fallbackApplicants =
    finalizedApplicants.length > 0
      ? finalizedApplicants
      : applicants.filter((candidate) => {
          const updatedAt = toTimestamp(candidate.updatedAtISO);
          const createdAt = toTimestamp(candidate.createdAtISO);
          return (
            typeof updatedAt === "number" &&
            typeof createdAt === "number" &&
            updatedAt > createdAt
          );
        });

  const durations = fallbackApplicants
    .map((candidate) => {
      const createdAt = toTimestamp(candidate.createdAtISO);
      const updatedAt = toTimestamp(candidate.updatedAtISO);
      if (typeof createdAt !== "number" || typeof updatedAt !== "number") {
        return null;
      }

      const diffMinutes = (updatedAt - createdAt) / (1000 * 60);
      return diffMinutes > 0 ? diffMinutes : null;
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (durations.length === 0) {
    return 0;
  }

  return Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10;
}

function normalizeJobStatus(value: unknown): FrontendJob["status"] {
  const status = trimText(value).toLowerCase();
  if (status === "screening") {
    return "Screening";
  }
  if (status === "complete" || status === "completed") {
    return "Complete";
  }
  if (status === "active") {
    return "Active";
  }
  return "Draft";
}

function extractCriteriaText(priority: string, criteria: Array<Record<string, any>>) {
  return criteria
    .filter(
      (criterion) => trimText(criterion.priority).toLowerCase() === priority,
    )
    .map((criterion) => trimText(criterion.criteria_string || criterion.description))
    .filter(Boolean)
    .join(", ");
}

export function inferDefaultCompanyName(userEmail: string) {
  const domain = trimText(userEmail).split("@")[1]?.split(".")[0];
  if (!domain) {
    return "Independent Recruiter";
  }

  return domain
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapUserToFrontend(user: any): FrontendUser {
  const hiringFocus =
    trimText(user?.onboarding_preferences?.hiring_focus) || undefined;
  const teamSetup =
    trimText(user?.onboarding_preferences?.team_setup) || undefined;
  const workflowGoal =
    trimText(user?.onboarding_preferences?.workflow_goal) || undefined;

  return {
    id: toId(user?._id),
    name: trimText(user?.user_name),
    email: trimText(user?.user_email),
    companyName: trimText(user?.company_name),
    authProvider: trimText(user?.auth_provider) || "local",
    isVerified: Boolean(user?.isVerified),
    onboardingCompleted: Boolean(user?.onboarding_completed),
    ...(hiringFocus || teamSetup || workflowGoal
      ? {
          onboardingPreferences: {
            ...(hiringFocus ? { hiringFocus } : {}),
            ...(teamSetup ? { teamSetup } : {}),
            ...(workflowGoal ? { workflowGoal } : {}),
          },
        }
      : {}),
    createdAtISO: toIso(user?.createdAt),
    updatedAtISO: toIso(user?.updatedAt),
  };
}

export function mapApplicantToFrontend(applicant: any): FrontendCandidate {
  const skills = normalizeSkills(applicant?.skills);
  const education = normalizeEducation(applicant?.education);
  const experience = normalizeExperience(applicant?.experience);
  const socialLinks = normalizeSocialLinks(applicant?.social_links);
  const additionalInfo = splitList(applicant?.additional_info);
  const technicalSkills = skills.map((item) => item.name).filter(Boolean);
  const softSkills = additionalInfo.filter(
    (item) =>
      !/\S+@\S+\.\S+/.test(item) &&
      !item.toLowerCase().includes("linkedin") &&
      !item.toLowerCase().includes("github"),
  );

  return {
    id: toId(applicant?._id),
    name: getDisplayName(applicant),
    currentTitle:
      trimText(applicant?.headline) ||
      extractHeadlineFromExperience(experience, trimText(applicant?.job_title)),
    company: trimText(experience[0]?.company) || undefined,
    location: inferLocation(applicant?.location),
    yearsExperience: inferExperienceYears(experience),
    email: trimText(applicant?.applicant_email ?? applicant?.email) || undefined,
    linkedIn: socialLinks.linkedin || undefined,
    resumeParsed: Boolean(trimText(applicant?.resume_text)),
    shortlisted:
      Boolean(applicant?.shortlisted) ||
      trimText(applicant?.applicant_state) === "Shortlisted",
    appliedJobId: trimText(applicant?.job_id) || undefined,
    appliedJobTitle: trimText(applicant?.job_title),
    createdAtISO: toIso(applicant?.createdAt),
    updatedAtISO: toIso(applicant?.updatedAt),
    skills: {
      technical: technicalSkills,
      soft: softSkills,
    },
    education: education.map((item) =>
      [item.degree, item.field_of_study, item.institution]
        .filter(Boolean)
        .join(" - "),
    ),
    workHistory: experience.map((item) => {
      const endISO = trimText(item.end_date);

      return {
        role: trimText(item.role),
        company: trimText(item.company),
        startISO: trimText(item.start_date) || new Date().toISOString(),
        ...(endISO ? { endISO } : {}),
        highlights: trimText(item.description)
          ? [trimText(item.description)]
          : item.technologies.map((technology) => trimText(technology)).filter(Boolean),
      };
    }),
  };
}

export function mapJobToFrontend(
  job: any,
  applicants: FrontendCandidate[],
): FrontendJob {
  const criteria = parseJobCriteria(job?.job_ai_criteria) as Array<Record<string, any>>;
  const title = trimText(job?.job_title);
  const applicantsForJob = applicants.filter(
    (candidate) =>
      candidate.appliedJobTitle.trim().toLowerCase() === title.toLowerCase() ||
      toId(job?._id) === trimText((candidate as any).job_id),
  );

  const mustHaveSkills =
    extractCriteriaText("high", criteria) ||
    criteria.map((item) => trimText(item.criteria_string)).join(", ");
  const niceToHaveSkills = extractCriteriaText("medium", criteria);
  const screeningQuestions = criteria
    .filter((item) =>
      `${item.criteria_string} ${item.description}`.toLowerCase().includes("question"),
    )
    .map((item) => trimText(item.description))
    .filter(Boolean)
    .join("\n");
  const dealBreakers = criteria
    .filter((item) =>
      `${item.criteria_string} ${item.description}`
        .toLowerCase()
        .includes("deal breaker"),
    )
    .map((item) => trimText(item.description))
    .filter(Boolean)
    .join(", ");

  return {
    id: toId(job?._id),
    title,
    department: trimText(job?.job_department),
    location: inferLocation(job?.job_location),
    employmentType: trimText(job?.job_employment_type) || "Full-time",
    experienceLevel: trimText(job?.job_experience_required) || "Not specified",
    salaryMin:
      typeof job?.job_salary_min === "number" ? job.job_salary_min : undefined,
    salaryMax:
      typeof job?.job_salary_max === "number" ? job.job_salary_max : undefined,
    workersRequired:
      typeof job?.workers_required === "number" ? job.workers_required : 1,
    minimumMarks:
      typeof job?.minimum_marks === "number" ? job.minimum_marks : 70,
    description: trimText(job?.job_description),
    responsibilities: trimText(job?.job_responsibilities),
    qualifications: trimText(job?.job_qualifications),
    aiCriteria: {
      mustHaveSkills,
      niceToHaveSkills,
      screeningQuestions,
      dealBreakers,
      shortlistSize: Number(job?.job_shortlist_size) === 20 ? 20 : 10,
    },
    status: normalizeJobStatus(job?.job_state),
    applicantsCount: applicantsForJob.length,
    shortlistedCount: applicantsForJob.filter((candidate) => candidate.shortlisted)
      .length,
    updatedAtISO:
      toIso(job?.updatedAt) || toIso(job?.createdAt) || new Date().toISOString(),
  };
}

export function buildDashboardStats(
  jobs: FrontendJob[],
  applicants: FrontendCandidate[],
): FrontendDashboardStats {
  const activeJobs = jobs.filter(
    (job) => job.status === "Active" || job.status === "Screening",
  ).length;
  const shortlisted = applicants.filter((candidate) => candidate.shortlisted)
    .length;
  const screeningJobs = jobs.filter((job) => job.status === "Screening").length;
  const avgTimePerCandidateMins = computeAverageHireTimeMinutes(applicants);

  return {
    activeJobs: {
      value: activeJobs,
      trend: neutralTrend("based on current data"),
    },
    totalApplicants: {
      value: applicants.length,
      trend: neutralTrend("based on current data"),
    },
    shortlisted: {
      value: shortlisted,
      trend: neutralTrend("based on current data"),
      conversionRatePct:
        applicants.length > 0
          ? Math.round((shortlisted / applicants.length) * 100)
          : 0,
    },
    inScreening: {
      value: screeningJobs,
      trend: neutralTrend(
        shortlisted > 0
          ? "avg. from applicant creation to shortlist"
          : "avg. from available candidate lifecycle data",
      ),
      avgTimePerCandidateMins,
    },
  };
}
