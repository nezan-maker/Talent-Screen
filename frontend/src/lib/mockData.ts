import type { Candidate, CandidateScore, DashboardStats, Job } from "@/types";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

export const mockJobs: Job[] = [
  {
    id: "job_001",
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Kigali (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "Senior",
    salaryMin: 45000,
    salaryMax: 70000,
    description: "Build modern web experiences and scalable services for our hiring platform.",
    responsibilities: "Own features end-to-end, collaborate with product & design, and ship reliably.",
    qualifications: "5+ years, strong TypeScript/React, solid backend fundamentals, pragmatic testing.",
    aiCriteria: {
      mustHaveSkills: "TypeScript, React, Node.js, SQL, System Design",
      niceToHaveSkills: "Next.js, AWS, Docker, CI/CD",
      screeningQuestions: "Describe a complex feature you shipped. How did you ensure quality and performance?",
      dealBreakers: "No production experience with web apps; inability to explain trade-offs.",
      shortlistSize: 10,
    },
    status: "Screening",
    applicantsCount: 87,
    shortlistedCount: 12,
    updatedAtISO: hoursAgo(6),
  },
  {
    id: "job_002",
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    employmentType: "Contract",
    experienceLevel: "Mid",
    description: "Design high-converting recruiter and candidate journeys.",
    responsibilities: "Create flows, wireframes, UI specs; partner closely with engineering.",
    qualifications: "Strong portfolio, UX instincts, and familiarity with design systems.",
    aiCriteria: {
      mustHaveSkills: "UX, UI, Figma",
      niceToHaveSkills: "Research, Accessibility",
      screeningQuestions: "Walk through a design you iterated based on feedback or data.",
      dealBreakers: "No portfolio; can't articulate rationale.",
      shortlistSize: 20,
    },
    status: "Active",
    applicantsCount: 34,
    shortlistedCount: 6,
    updatedAtISO: daysAgo(2),
  },
  {
    id: "job_003",
    title: "HR Operations Specialist",
    department: "People",
    location: "Kigali",
    employmentType: "Full-time",
    experienceLevel: "Junior",
    description: "Support recruiting ops and candidate communications.",
    responsibilities: "Coordinate interviews, manage pipelines, keep stakeholders aligned.",
    qualifications: "Detail-oriented, great communication, comfort with tools.",
    aiCriteria: {
      mustHaveSkills: "Communication, Organization",
      niceToHaveSkills: "ATS experience",
      screeningQuestions: "How do you prioritize when multiple stakeholders are waiting?",
      dealBreakers: "Poor communication.",
      shortlistSize: 10,
    },
    status: "Draft",
    applicantsCount: 0,
    shortlistedCount: 0,
    updatedAtISO: daysAgo(5),
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: "cand_001",
    name: "Niyogushimwa Honore",
    currentTitle: "Full Stack Engineer",
    company: "FinTechCo",
    location: "Kigali",
    yearsExperience: 6,
    email: "honore@example.com",
    linkedIn: "linkedin.com/in/honore",
    skills: {
      technical: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"],
      soft: ["Ownership", "Communication", "Mentoring"],
    },
    education: ["BSc Computer Science — University of Rwanda"],
    workHistory: [
      {
        role: "Full Stack Engineer",
        company: "FinTechCo",
        startISO: "2022-01-01T00:00:00.000Z",
        highlights: ["Led onboarding revamp (+18% completion)", "Built internal design system"],
      },
      {
        role: "Frontend Engineer",
        company: "StartupX",
        startISO: "2019-01-01T00:00:00.000Z",
        endISO: "2021-12-31T00:00:00.000Z",
        highlights: ["Shipped analytics dashboard", "Improved bundle size by 28%"],
      },
    ],
  },
  {
    id: "cand_002",
    name: "Neza Niel",
    currentTitle: "Backend Engineer",
    company: "Logistics Labs",
    location: "Remote",
    yearsExperience: 7,
    email: "neza@example.com",
    linkedIn: "linkedin.com/in/nezaniel",
    skills: {
      technical: ["Node.js", "SQL", "Kafka", "Redis", "REST", "System Design"],
      soft: ["Problem Solving", "Stakeholder Management"],
    },
    education: ["BEng Software Engineering — AUCA"],
    workHistory: [
      {
        role: "Backend Engineer",
        company: "Logistics Labs",
        startISO: "2021-03-01T00:00:00.000Z",
        highlights: ["Reduced API p95 by 35%", "Migrated monolith to services"],
      },
    ],
  },
  {
    id: "cand_003",
    name: "Niyompuhwe Robert",
    currentTitle: "Frontend Engineer",
    company: "HealthTech",
    location: "Kigali",
    yearsExperience: 4,
    email: "robert@example.com",
    linkedIn: "linkedin.com/in/niyompuhwerobert",
    skills: {
      technical: ["React", "Next.js", "Tailwind", "TypeScript", "Testing Library"],
      soft: ["Collaboration", "User empathy"],
    },
    education: ["BSc Information Systems — University of Rwanda"],
    workHistory: [
      {
        role: "Frontend Engineer",
        company: "HealthTech",
        startISO: "2022-05-01T00:00:00.000Z",
        highlights: ["Built patient portal", "Introduced accessibility checks"],
      },
    ],
  },
];

export const mockCandidateScores: CandidateScore[] = [
  {
    candidateId: "cand_001",
    jobId: "job_001",
    score: 92,
    skillsMatchPct: 95,
    experiencePct: 90,
    educationPct: 85,
    overallRelevancePct: 92,
    reasoning:
      "Strong TypeScript/React depth, proven ownership of end-to-end features, and solid cloud + Docker experience aligned to must-have criteria.",
    strengths: ["TypeScript + React mastery", "Owns features end-to-end", "Strong SQL fundamentals"],
    gaps: ["Limited explicit system design write-ups in resume"],
    screenedAtISO: hoursAgo(3),
  },
  {
    candidateId: "cand_002",
    jobId: "job_001",
    score: 76,
    skillsMatchPct: 78,
    experiencePct: 86,
    educationPct: 82,
    overallRelevancePct: 80,
    reasoning:
      "Excellent backend and systems experience; frontend depth is less clear. Likely strong for full-stack with additional React/Next evidence.",
    strengths: ["Strong backend systems", "Performance-minded", "Pragmatic trade-offs"],
    gaps: ["Frontend experience not demonstrated", "Limited UI/UX exposure"],
    screenedAtISO: hoursAgo(8),
  },
  {
    candidateId: "cand_003",
    jobId: "job_001",
    score: 84,
    skillsMatchPct: 88,
    experiencePct: 80,
    educationPct: 85,
    overallRelevancePct: 85,
    reasoning:
      "Strong Next.js and UI craftsmanship; slightly fewer years of experience but strong evidence of quality practices and accessibility.",
    strengths: ["Next.js + Tailwind", "Quality mindset (testing, a11y)", "Clear product collaboration"],
    gaps: ["Backend depth not explicit", "System design experience limited"],
    screenedAtISO: hoursAgo(5),
  },
];

export const mockDashboardStats: DashboardStats = {
  activeJobs: { value: 12, trend: { label: "from last month", value: "+2", direction: "up" } },
  totalApplicants: { value: 241, trend: { label: "vs last month", value: "+18%", direction: "up" } },
  shortlisted: {
    value: 38,
    trend: { label: "conversion", value: "15.7%", direction: "neutral" },
    conversionRatePct: 15.7,
  },
  inScreening: {
    value: 24,
    trend: { label: "avg time/candidate", value: "6m", direction: "neutral" },
    avgTimePerCandidateMins: 6,
  },
};

