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
  location: string;
  yearsExperience: number;
  email?: string | undefined;
  linkedIn?: string | undefined;
  shortlisted: boolean;
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
  isVerified: boolean;
  createdAtISO?: string | undefined;
  updatedAtISO?: string | undefined;
};

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail",
  "hotmail",
  "icloud",
  "outlook",
  "yahoo",
]);

function toId(value: unknown) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return value.toString();
  }

  return String(value);
}

function toIso(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function splitList(value: unknown) {
  if (!value) {
    return [];
  }

  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.join(",")
        : String(value);

  return Array.from(
    new Set(
      raw
        .split(/[\n,;|]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function inferLocation(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "Location not provided";
}

function findLinkedIn(values: string[]) {
  return values.find((item) => item.toLowerCase().includes("linkedin"));
}

function normalizeCompanyName(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  const domain = email.split("@")[1];
  const domainName = domain?.split(".")[0];

  if (!domainName || GENERIC_EMAIL_DOMAINS.has(domainName)) {
    return "Independent Recruiter";
  }

  return domainName
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeJobStatus(value: unknown): FrontendJob["status"] {
  const status = String(value ?? "").trim().toLowerCase();

  if (status === "complete" || status === "completed") {
    return "Complete";
  }

  if (status === "screening") {
    return "Screening";
  }

  if (status === "active") {
    return "Active";
  }

  return "Draft";
}

function neutralTrend(label: string): FrontendTrend {
  return {
    label,
    value: "No change",
    direction: "neutral",
  };
}

function pickCriterionText(
  criteria: Array<Record<string, any>>,
  matcher: (criterion: Record<string, any>) => boolean,
) {
  return criteria
    .filter(matcher)
    .map((criterion) => String(criterion.criteria_string ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

export function inferDefaultCompanyName(userEmail: string) {
  return normalizeCompanyName(userEmail);
}

export function mapUserToFrontend(user: any): FrontendUser {
  return {
    id: toId(user?._id),
    name: String(user?.user_name ?? "").trim(),
    email: String(user?.user_email ?? "").trim(),
    isVerified: Boolean(user?.isVerified),
    createdAtISO: toIso(user?.createdAt),
    updatedAtISO: toIso(user?.updatedAt),
  };
}

export function mapApplicantToFrontend(applicant: any): FrontendCandidate {
  const additionalInfo = splitList(applicant?.additional_info);
  const email =
    String(applicant?.applicant_email ?? "").trim() ||
    additionalInfo.find((item) => /\S+@\S+\.\S+/.test(item));
  const linkedIn = findLinkedIn(additionalInfo);
  const softSignals = additionalInfo.filter(
    (item) => item !== email && item !== linkedIn,
  );

  return {
    id: toId(applicant?._id),
    name: String(applicant?.applicant_name ?? "").trim(),
    currentTitle: String(applicant?.job_title ?? "").trim(),
    location: inferLocation(applicant?.location),
    yearsExperience: Number(applicant?.experience ?? 0),
    email: email || undefined,
    linkedIn: linkedIn || undefined,
    shortlisted: Boolean(applicant?.shortlisted),
    appliedJobTitle: String(applicant?.job_title ?? "").trim(),
    createdAtISO: toIso(applicant?.createdAt),
    updatedAtISO: toIso(applicant?.updatedAt),
    skills: {
      technical: splitList(applicant?.skills),
      soft: softSignals,
    },
    education: splitList(applicant?.education),
    workHistory: [],
  };
}

export function mapJobToFrontend(
  job: any,
  applicants: FrontendCandidate[],
): FrontendJob {
  const criteriaSource = Array.isArray(job?.job_ai_criteria)
    ? job.job_ai_criteria
    : Array.isArray(job?.job_description)
      ? job.job_description
      : [];
  const criteria = criteriaSource.filter(
    (criterion: unknown): criterion is Record<string, any> =>
      Boolean(criterion && typeof criterion === "object"),
  );
  const title = String(job?.job_title ?? "").trim();
  const applicantsForJob = applicants.filter(
    (candidate) =>
      candidate.appliedJobTitle.trim().toLowerCase() === title.toLowerCase(),
  );

  const mustHaveSkills =
    pickCriterionText(
      criteria,
      (criterion) => String(criterion.priority ?? "").toLowerCase() === "high",
    ) || pickCriterionText(criteria, () => true);
  const niceToHaveSkills = pickCriterionText(
    criteria,
    (criterion) => String(criterion.priority ?? "").toLowerCase() === "medium",
  );
  const screeningQuestions = criteria
    .filter((criterion: Record<string, any>) =>
      String(criterion.criteria_string ?? "")
        .toLowerCase()
        .includes("question"),
    )
    .map((criterion: Record<string, any>) =>
      String(criterion.description ?? "").trim(),
    )
    .filter(Boolean)
    .join("\n");
  const dealBreakers = criteria
    .filter((criterion: Record<string, any>) =>
      `${criterion.criteria_string ?? ""} ${criterion.description ?? ""}`
        .toLowerCase()
        .includes("deal breaker"),
    )
    .map((criterion: Record<string, any>) =>
      String(criterion.description ?? "").trim(),
    )
    .filter(Boolean)
    .join(", ");
  const description =
    typeof job?.job_description === "string"
      ? job.job_description
      : criteria
          .map((criterion: Record<string, any>) =>
            String(criterion.description ?? "").trim(),
          )
          .filter(Boolean)
          .join("\n");
  const shortlistSize = Number(job?.job_shortlist_size) === 20 ? 20 : 10;

  return {
    id: toId(job?._id),
    title,
    department: String(job?.job_department ?? "").trim(),
    location: inferLocation(job?.job_location),
    employmentType: String(job?.job_employment_type ?? "").trim() || "Full-time",
    experienceLevel:
      String(job?.job_experience_required ?? "").trim() || "Not specified",
    salaryMin:
      typeof job?.job_salary_min === "number" ? job.job_salary_min : undefined,
    salaryMax:
      typeof job?.job_salary_max === "number" ? job.job_salary_max : undefined,
    description: String(description ?? "").trim(),
    responsibilities: String(job?.job_responsibilities ?? "").trim(),
    qualifications: String(job?.job_qualifications ?? "").trim(),
    aiCriteria: {
      mustHaveSkills,
      niceToHaveSkills,
      screeningQuestions,
      dealBreakers,
      shortlistSize,
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
      trend: neutralTrend("based on current data"),
      avgTimePerCandidateMins: applicants.length > 0 ? 8 : 0,
    },
  };
}
