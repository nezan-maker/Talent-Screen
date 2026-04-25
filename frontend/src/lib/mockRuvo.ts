import { ROUTES } from "@/lib/constants";
import {
  mockCandidates,
  mockCandidateScores,
  mockChatHistory,
  mockDashboardStats,
  mockJobs,
} from "@/lib/mockData";
import { resolveCandidate } from "@/lib/mockUi";
import type { Candidate, Job } from "@/types";

const RUVO_STORAGE_KEY = "talvo:assistant:conversations:v1";

export type MockRuvoInsightTone = "default" | "accent" | "success" | "warning";

export type MockRuvoInsight = {
  label: string;
  value: string;
  tone?: MockRuvoInsightTone;
};

export type MockRuvoAction = {
  label: string;
  href?: string;
  prompt?: string;
};

export type MockRuvoAssistantPayload = {
  intro: string;
  bullets?: string[];
  insights?: MockRuvoInsight[];
  closing?: string;
  followUps?: string[];
  actions?: MockRuvoAction[];
};

export type MockRuvoMessage = {
  id: string;
  role: "assistant" | "user";
  createdAtISO: string;
  text?: string;
  status?: "thinking" | "complete";
  payload?: MockRuvoAssistantPayload;
};

export type MockRuvoConversation = {
  id: string;
  title: string;
  updatedAtISO: string;
  messages: MockRuvoMessage[];
};

type CandidateMatch = {
  candidate: Candidate;
  score: number;
  explicit: boolean;
  reason: string;
};

function uid(prefix = "ruvo") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function truncateTitle(value: string) {
  const cleaned = value.trim();
  if (!cleaned) {
    return "New chat";
  }

  return cleaned.length > 42 ? `${cleaned.slice(0, 39)}...` : cleaned;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function splitSkills(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRoleSearchSpace(job: Job) {
  return tokenize(`${job.title} ${job.department} ${job.location} ${job.experienceLevel}`);
}

function getResolvedCandidates() {
  return mockCandidates.map(resolveCandidate);
}

function getBestJobForPrompt(prompt: string) {
  const query = prompt.toLowerCase();
  let bestJob = mockJobs[0];
  let bestScore = -1;

  for (const job of mockJobs) {
    const searchSpace = buildRoleSearchSpace(job);
    const score = searchSpace.reduce((total, token) => {
      return total + (query.includes(token) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestJob = job;
    }
  }

  if (query.includes("design")) {
    return mockJobs.find((job) => job.title.toLowerCase().includes("designer")) ?? bestJob;
  }

  if (query.includes("people") || query.includes("hr")) {
    return mockJobs.find((job) => job.title.toLowerCase().includes("hr")) ?? bestJob;
  }

  return bestJob;
}

function inferCandidateScore(job: Job, candidate: Candidate): CandidateMatch {
  const explicit = mockCandidateScores.find(
    (item) => item.jobId === job.id && item.candidateId === candidate.id,
  );
  if (explicit) {
    return {
      candidate,
      score: explicit.score,
      explicit: true,
      reason: explicit.reasoning,
    };
  }

  const candidateText = `${candidate.currentTitle} ${candidate.appliedJobTitle ?? ""} ${candidate.location} ${candidate.skills.technical.join(" ")} ${candidate.skills.soft.join(" ")}`.toLowerCase();
  const requiredSkills = splitSkills(job.aiCriteria.mustHaveSkills.toLowerCase());
  const niceToHaveSkills = splitSkills(job.aiCriteria.niceToHaveSkills.toLowerCase());

  const matchedMustHave = requiredSkills.filter((skill) => candidateText.includes(skill));
  const matchedNiceToHave = niceToHaveSkills.filter((skill) => candidateText.includes(skill));
  const roleAlignment = tokenize(job.title).filter((token) => candidateText.includes(token)).length;

  const targetExperience =
    job.experienceLevel === "Senior" ? 5 : job.experienceLevel === "Mid" ? 3 : 1;
  const experienceScore = Math.min(candidate.yearsExperience / targetExperience, 1.25) * 18;
  const shortlistBonus = candidate.shortlisted ? 4 : 0;
  const locationBonus =
    job.location.toLowerCase().includes("remote") ||
    candidate.location.toLowerCase().includes("remote") ||
    candidate.location.toLowerCase().includes("kigali")
      ? 6
      : 0;

  const score = clamp(
    Math.round(
      32 +
        matchedMustHave.length * 14 +
        matchedNiceToHave.length * 6 +
        roleAlignment * 5 +
        experienceScore +
        shortlistBonus +
        locationBonus,
    ),
    38,
    94,
  );

  const matchedLabels = [...matchedMustHave, ...matchedNiceToHave].slice(0, 2);
  const reason =
    matchedLabels.length > 0
      ? `Strong overlap on ${matchedLabels.join(" and ")} with enough experience to contribute quickly.`
      : `Closest fit based on title alignment, transferable skills, and current demo workspace data.`;

  return {
    candidate,
    score,
    explicit: false,
    reason,
  };
}

function getCandidateMatches(job: Job) {
  return getResolvedCandidates()
    .map((candidate) => inferCandidateScore(job, candidate))
    .sort((left, right) => right.score - left.score);
}

function buildMatchesReply(prompt: string): MockRuvoAssistantPayload {
  const job = getBestJobForPrompt(prompt);
  const matches = getCandidateMatches(job).slice(0, 3);
  const strongMatches = getCandidateMatches(job).filter((item) => item.score >= 80).length;

  return {
    intro: `I matched the current demo candidate pool against ${job.title}. These are the strongest fits right now.`,
    insights: [
      { label: "Strong matches", value: `${strongMatches}`, tone: "success" },
      { label: "Applicants", value: `${job.applicantsCount}`, tone: "default" },
      { label: "Suggested shortlist", value: `Top ${job.aiCriteria.shortlistSize}`, tone: "accent" },
    ],
    bullets: matches.map((item, index) => {
      const skills = item.candidate.skills.technical.slice(0, 3).join(", ");
      return `${index + 1}. ${item.candidate.name} - ${item.score}% match. ${item.reason} Key signals: ${skills}.`;
    }),
    closing:
      strongMatches > 0
        ? `If you want, I can also break down who is strongest by skills, experience, or likely interview readiness.`
        : `There are no truly high-confidence matches yet, so I would widen sourcing before screening too aggressively.`,
    followUps: [
      `Why is ${matches[0]?.candidate.name ?? "the top match"} ranked first?`,
      `Show the biggest gaps for ${job.title}`,
      `Draft screening questions for ${job.title}`,
    ],
    actions: [
      { label: "Open role", href: `${ROUTES.jobs}/${job.id}` },
      { label: "Review candidates", href: ROUTES.candidates },
      { label: "Explain top match", prompt: `Explain why ${matches[0]?.candidate.name ?? "the top candidate"} is a strong fit for ${job.title}.` },
    ],
  };
}

function buildPipelineReply(): MockRuvoAssistantPayload {
  const resolvedCandidates = getResolvedCandidates();
  const activeJobs = mockJobs.filter((job) => job.status === "Active").length;
  const draftJobs = mockJobs.filter((job) => job.status === "Draft").length;
  const screeningJobs = mockJobs.filter((job) => job.status === "Screening").length;
  const topQueue = [...mockJobs].sort((left, right) => right.applicantsCount - left.applicantsCount)[0];
  const shortlisted = resolvedCandidates.filter((candidate) => candidate.shortlisted).length;
  const inReview = resolvedCandidates.length - shortlisted;

  return {
    intro: `Here is the pipeline snapshot from the current demo workspace.`,
    insights: [
      { label: "Active roles", value: `${activeJobs}`, tone: "accent" },
      { label: "In screening", value: `${screeningJobs}`, tone: "warning" },
      { label: "Draft roles", value: `${draftJobs}`, tone: draftJobs > 0 ? "warning" : "default" },
      { label: "Candidates in review", value: `${inReview}`, tone: "default" },
    ],
    bullets: [
      `${topQueue.title} carries the largest queue right now with ${topQueue.applicantsCount} applicants.`,
      `${mockJobs[0].title} is already in screening, which makes it the fastest role to push toward a shortlist.`,
      `${shortlisted} candidate${shortlisted === 1 ? " is" : "s are"} currently marked as shortlisted in the demo workspace.`,
    ],
    closing:
      draftJobs > 0
        ? `The clearest bottleneck is still setup readiness: finishing the draft role will unblock another sourcing lane.`
        : `The main opportunity now is review speed: the biggest queue is large enough that a shortlist pass would create immediate momentum.`,
    followUps: [
      "What is slowing down engineering hiring?",
      "Show my highest priority role",
      "Which candidates should I review first?",
    ],
    actions: [
      { label: "Open dashboard", href: ROUTES.dashboard },
      { label: "View jobs", href: ROUTES.jobs },
      { label: "Open candidates", href: ROUTES.candidates },
    ],
  };
}

function buildInsightsReply(): MockRuvoAssistantPayload {
  const topConversionJob = [...mockJobs]
    .filter((job) => job.applicantsCount > 0)
    .sort(
      (left, right) =>
        right.shortlistedCount / right.applicantsCount - left.shortlistedCount / left.applicantsCount,
    )[0];

  return {
    intro: `These are the biggest hiring signals I can see from the demo analytics layer.`,
    insights: [
      {
        label: "Applicants",
        value: `${mockDashboardStats.totalApplicants.value}`,
        tone: "default",
      },
      {
        label: "Shortlist conversion",
        value: `${mockDashboardStats.shortlisted.conversionRatePct}%`,
        tone: "success",
      },
      {
        label: "Avg screening time",
        value: `${mockDashboardStats.inScreening.avgTimePerCandidateMins}m`,
        tone: "accent",
      },
    ],
    bullets: [
      `${topConversionJob.title} is the strongest-performing role in the demo set, with ${topConversionJob.shortlistedCount} shortlisted from ${topConversionJob.applicantsCount} applicants.`,
      `The applicant funnel is still growing: total applicants are trending ${mockDashboardStats.totalApplicants.trend.value} ${mockDashboardStats.totalApplicants.trend.label}.`,
      `Screening load is manageable right now, with ${mockDashboardStats.inScreening.value} candidates in progress and an average processing time of ${mockDashboardStats.inScreening.avgTimePerCandidateMins} minutes per candidate.`,
    ],
    closing:
      `If you want a sharper operational read, I can turn this into recommendations for sourcing, review speed, or shortlist quality.`,
    followUps: [
      "What should I prioritize this week?",
      "Show top-performing job roles",
      "Where is the biggest hiring bottleneck?",
    ],
    actions: [
      { label: "Open analytics dashboard", href: ROUTES.dashboard },
      { label: "Summarize pipeline next", prompt: "Summarize my current pipeline and tell me what needs attention." },
    ],
  };
}

function buildScreeningQuestionsReply(prompt: string): MockRuvoAssistantPayload {
  const job = getBestJobForPrompt(prompt);
  const coreSkills = splitSkills(job.aiCriteria.mustHaveSkills).slice(0, 3);
  const roleLabel = job.title;

  return {
    intro: `I drafted a recruiter-friendly screening set for ${roleLabel} using the current mock brief.`,
    bullets: [
      `Tell me about a recent project where you used ${coreSkills[0] ?? "your core skill set"} to deliver an outcome with measurable impact.`,
      `This role depends on ${coreSkills[1] ?? "cross-functional execution"}. How do you make trade-offs when speed, quality, and stakeholder expectations collide?`,
      `What would a strong 90-day ramp look like for you in a ${roleLabel} position?`,
      `Which part of this role feels most natural to you, and where would you want support during the first month?`,
    ],
    insights: [
      { label: "Role", value: roleLabel, tone: "accent" },
      { label: "Must-haves", value: `${splitSkills(job.aiCriteria.mustHaveSkills).length}`, tone: "default" },
      { label: "Shortlist target", value: `Top ${job.aiCriteria.shortlistSize}`, tone: "success" },
    ],
    closing:
      `I can also rewrite these into a more technical, behavioral, or hiring-manager style interview set.`,
    followUps: [
      `Make these questions more technical for ${roleLabel}`,
      `Turn these into a scorecard for ${roleLabel}`,
      `Show the top candidates for ${roleLabel}`,
    ],
    actions: [
      { label: "Open role brief", href: `${ROUTES.jobs}/${job.id}` },
      { label: "Find matches", prompt: `Suggest the top candidates for ${roleLabel}.` },
    ],
  };
}

function buildDefaultReply(): MockRuvoAssistantPayload {
  const unreadNotifications = typeof window === "undefined"
    ? 0
    : safeParse<Array<{ read: boolean }>>(window.localStorage.getItem("talvo:notifications:v1"))?.filter(
        (item) => !item.read,
      ).length ?? 0;

  return {
    intro: `I can behave like a live recruiting copilot using the demo workspace data already in this project.`,
    insights: [
      { label: "Open roles", value: `${mockJobs.length}`, tone: "accent" },
      { label: "Candidate records", value: `${mockCandidates.length}`, tone: "default" },
      { label: "Unread alerts", value: `${unreadNotifications}`, tone: unreadNotifications > 0 ? "warning" : "default" },
    ],
    bullets: [
      `I can rank mock candidates against a role, explain AI-style reasoning, and point you to the strongest matches.`,
      `I can summarize the demo pipeline, surface bottlenecks, and highlight what likely needs recruiter attention next.`,
      `I can draft screening questions or turn the current job brief into a more structured shortlist workflow.`,
    ],
    closing:
      `Try asking for top matches, pipeline insights, time-to-hire, or draft screening questions for any role in the workspace.`,
    followUps: [
      "Show top-performing job roles",
      "Suggest 3 matches for the Senior Full Stack Engineer role",
      "Draft screening questions for Product Designer",
    ],
    actions: [
      { label: "Get quick summary", prompt: "Give me a quick recruiting summary for today." },
      { label: "Open dashboard", href: ROUTES.dashboard },
    ],
  };
}

export function buildMockRuvoReply(prompt: string): MockRuvoAssistantPayload {
  const query = prompt.toLowerCase();

  if (
    query.includes("question") ||
    query.includes("scorecard") ||
    query.includes("criteria") ||
    query.includes("interview")
  ) {
    return buildScreeningQuestionsReply(prompt);
  }

  if (
    query.includes("match") ||
    query.includes("candidate") ||
    query.includes("shortlist") ||
    query.includes("find top") ||
    query.includes("find the best")
  ) {
    return buildMatchesReply(prompt);
  }

  if (
    query.includes("pipeline") ||
    query.includes("review") ||
    query.includes("bottleneck") ||
    query.includes("slowing down") ||
    query.includes("priority")
  ) {
    return buildPipelineReply();
  }

  if (
    query.includes("insight") ||
    query.includes("trend") ||
    query.includes("analytics") ||
    query.includes("average time") ||
    query.includes("time to hire") ||
    query.includes("top-performing")
  ) {
    return buildInsightsReply();
  }

  return buildDefaultReply();
}

function assistantMessageFromPrompt(prompt: string): MockRuvoMessage {
  return {
    id: uid("assistant"),
    role: "assistant",
    createdAtISO: new Date().toISOString(),
    status: "complete",
    payload: buildMockRuvoReply(prompt),
  };
}

function buildSeedConversations(): MockRuvoConversation[] {
  const seedPrompts = [
    {
      id: mockChatHistory[0]?.id ?? "chat_001",
      title: "Top-performing job roles",
      prompt: "Show top-performing job roles",
    },
    {
      id: mockChatHistory[1]?.id ?? "chat_002",
      title: "Engineering bottlenecks",
      prompt: "What is slowing down hiring for the Senior Full Stack Engineer role?",
    },
    {
      id: mockChatHistory[2]?.id ?? "chat_003",
      title: "Best matches",
      prompt: "Suggest 3 matches for the Senior Full Stack Engineer role",
    },
    {
      id: mockChatHistory[3]?.id ?? "chat_004",
      title: "Time to hire",
      prompt: "What is the average time to hire right now?",
    },
  ];

  return seedPrompts.map((item, index) => {
    const createdAt = new Date(Date.now() - (seedPrompts.length - index) * 3600_000).toISOString();
    return {
      id: item.id,
      title: item.title,
      updatedAtISO: createdAt,
      messages: [
        {
          id: uid("user"),
          role: "user",
          createdAtISO: createdAt,
          text: item.prompt,
          status: "complete",
        },
        {
          ...assistantMessageFromPrompt(item.prompt),
          createdAtISO: createdAt,
        },
      ],
    };
  });
}

export function getMockRuvoConversations() {
  if (typeof window === "undefined") {
    return buildSeedConversations();
  }

  const stored = safeParse<MockRuvoConversation[]>(window.localStorage.getItem(RUVO_STORAGE_KEY));
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  const seeded = buildSeedConversations();
  window.localStorage.setItem(RUVO_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function setMockRuvoConversations(next: MockRuvoConversation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RUVO_STORAGE_KEY, JSON.stringify(next));
}

export function createConversationTitle(prompt: string) {
  return truncateTitle(prompt);
}
