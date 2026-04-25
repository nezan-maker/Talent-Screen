import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";
import { z } from "zod";
import env from "../config/env.js";
import {
  inferExperienceYears,
  normalizeAvailability,
  normalizeCertifications,
  normalizeEducation,
  normalizeExperience,
  normalizeLanguages,
  normalizeProjects,
  normalizeSocialLinks,
  normalizeSkills,
  parseJobCriteria,
  splitList,
  trimText,
} from "../utils/talentProfile.js";

export type ScreeningCandidateInput = {
  applicantId: string;
  fullName?: string;
  email?: string;
  location?: string;
  skills?: string[];
  yearsExperience?: number;
  education?: string[];
  resumeText?: string;
};

export type ScreeningJobInput = {
  jobId: string;
  title: string;
  requirements: string[];
  skills: string[];
  experienceYearsMin?: number;
  education: string[];
  notes?: string;
};

export const geminiOutputSchema = z.object({
  shortlist: z
    .array(
      z.object({
        applicantId: z.string().min(1),
        rank: z.number().int().min(1),
        matchScore: z.number().min(0).max(100),
        strengths: z.array(z.string()).default([]),
        gaps: z.array(z.string()).default([]),
        recommendation: z.string().min(1),
      }),
    )
    .min(1),
});

const assistantOutputSchema = z.object({
  answer: z.string().min(1),
  suggestedNextQuestions: z.array(z.string().min(1)).default([]),
});

const enrichmentOutputSchema = z.object({
  items: z.array(
    z.object({
      candidate_id: z.string().min(1),
      summary: z.string().default(""),
      strengths: z.array(z.string()).default([]),
      gaps: z.array(z.string()).default([]),
      recommendation: z.string().default(""),
    }),
  ),
});

type AiStudioAuth = {
  provider: "ai-studio";
  apiKey: string;
};

type VertexAuth = {
  provider: "vertex";
  projectId: string;
  location: string;
};

export type GeminiAuth = AiStudioAuth | VertexAuth;

const MODEL_FALLBACKS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];
const GEMINI_REQUEST_TIMEOUT_MS = 60_000;

export type ParsedResumeObjectFields = {
  skills: ReturnType<typeof normalizeSkills>;
  languages: ReturnType<typeof normalizeLanguages>;
  experience: ReturnType<typeof normalizeExperience>;
  education: ReturnType<typeof normalizeEducation>;
  certifications: ReturnType<typeof normalizeCertifications>;
  projects: ReturnType<typeof normalizeProjects>;
  availability?: ReturnType<typeof normalizeAvailability>;
  social_links?: ReturnType<typeof normalizeSocialLinks>;
};

function parseYearsFromText(value: unknown) {
  const text = trimText(value);
  const match = text.match(/(\d+)\+?\s*years?/i);
  if (!match) {
    return undefined;
  }

  const years = Number(match[1]);
  return Number.isFinite(years) ? years : undefined;
}

function gradeFromScore(score: number) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function extractFirstJsonObject(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}

function uniqueModels(models: string[]) {
  return Array.from(new Set(models.map((item) => trimText(item)).filter(Boolean)));
}

function shouldFallbackModel(error: unknown) {
  const errorLike = error as { status?: unknown; message?: unknown };
  const status =
    typeof errorLike.status === "number" ? errorLike.status : Number(errorLike.status);
  const message = trimText(errorLike.message).toLowerCase();
  return (
    status === 404 ||
    message.includes("not found") ||
    message.includes("not supported for generatecontent") ||
    message.includes("listmodels")
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutHandle);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });
  });
}

function resolveAuthOrNull(input?: {
  aiStudioApiKey?: string;
  vertexProjectId?: string;
  vertexLocation?: string;
}): GeminiAuth | null {
  const aiStudioApiKey = trimText(input?.aiStudioApiKey ?? env.GOOGLE_API_KEY);
  if (aiStudioApiKey) {
    return { provider: "ai-studio", apiKey: aiStudioApiKey };
  }

  const projectId = trimText(input?.vertexProjectId ?? env.VERTEX_PROJECT_ID);
  const location = trimText(input?.vertexLocation ?? env.VERTEX_LOCATION);
  if (projectId && location) {
    return { provider: "vertex", projectId, location };
  }

  return null;
}

export function resolveGeminiAuth(input?: {
  aiStudioApiKey?: string;
  vertexProjectId?: string;
  vertexLocation?: string;
}) {
  return resolveAuthOrNull(input);
}

export function hasGeminiConfig() {
  return Boolean(resolveAuthOrNull());
}

async function generateWithGemini(
  opts: GeminiAuth & {
    model: string;
    prompt: string;
  },
) {
  if (opts.provider === "ai-studio") {
    const genAI = new GoogleGenerativeAI(opts.apiKey);
    const modelsToTry = uniqueModels([opts.model, ...MODEL_FALLBACKS]);

    let lastError: unknown = null;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await withTimeout(
          model.generateContent(opts.prompt),
          GEMINI_REQUEST_TIMEOUT_MS,
          `Gemini request timed out after ${GEMINI_REQUEST_TIMEOUT_MS / 1000} seconds.`,
        );
        return result.response.text().trim();
      } catch (error) {
        lastError = error;
        if (shouldFallbackModel(error)) {
          continue;
        }
        throw error;
      }
    }

    throw lastError ?? new Error("Gemini request failed");
  }

  const vertex = new VertexAI({ project: opts.projectId, location: opts.location });
  const model = vertex.getGenerativeModel({ model: opts.model });
  const result = await withTimeout<any>(
    model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: opts.prompt }],
        },
      ],
    }),
    GEMINI_REQUEST_TIMEOUT_MS,
    `Gemini request timed out after ${GEMINI_REQUEST_TIMEOUT_MS / 1000} seconds.`,
  );

  const text =
    result.response.candidates?.[0]?.content?.parts
      ?.map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("") ?? "";

  return text.trim();
}

function mapJobContext(rawJob: unknown): ScreeningJobInput | undefined {
  if (!rawJob || typeof rawJob !== "object") {
    return undefined;
  }

  const job = rawJob as Record<string, unknown>;
  const id = trimText(job._id ?? job.job_id ?? job.jobId);
  const title = trimText(job.job_title ?? job.title);
  if (!id && !title) {
    return undefined;
  }

  const criteria = parseJobCriteria(job.job_ai_criteria ?? job.criteria);
  const skills = criteria.map((item) => trimText(item.criteria_string)).filter(Boolean);
  const requirements = splitList(
    [job.requirements, job.job_qualifications, job.job_responsibilities]
      .map((value) => trimText(value))
      .filter(Boolean)
      .join("\n"),
  );
  const education = splitList(job.education ?? job.job_qualifications);
  const notes = trimText(job.notes ?? job.job_description);
  const experienceYearsMin =
    typeof job.experienceYearsMin === "number"
      ? job.experienceYearsMin
      : parseYearsFromText(job.job_experience_required);

  return {
    jobId: id || `job:${title || "unknown"}`,
    title: title || "Role",
    requirements,
    skills,
    ...(typeof experienceYearsMin === "number" ? { experienceYearsMin } : {}),
    education,
    ...(notes ? { notes } : {}),
  };
}

function mapCandidateContext(rawCandidate: unknown, index: number): ScreeningCandidateInput {
  const candidate =
    rawCandidate && typeof rawCandidate === "object"
      ? (rawCandidate as Record<string, unknown>)
      : {};

  const id = trimText(
    candidate.applicantId ??
      candidate.applicant_id ??
      candidate.candidate_id ??
      candidate._id,
  );
  const fullName = trimText(candidate.fullName ?? candidate.applicant_name);
  const email = trimText(candidate.email ?? candidate.applicant_email);
  const location = trimText(candidate.location);
  const resumeText = trimText(candidate.resumeText ?? candidate.resume_text);

  const skills = Array.isArray(candidate.skills)
    ? normalizeSkills(candidate.skills).map((item) => trimText(item.name)).filter(Boolean)
    : normalizeSkills(candidate.skills).map((item) => trimText(item.name)).filter(Boolean);
  const experience = normalizeExperience(candidate.experience);
  const yearsExperienceRaw = Number(candidate.yearsExperience ?? candidate.experience_in_years);
  const yearsExperience = Number.isFinite(yearsExperienceRaw)
    ? yearsExperienceRaw
    : inferExperienceYears(experience);

  const education = normalizeEducation(candidate.education).map((item) =>
    [trimText(item.degree), trimText(item.field_of_study), trimText(item.institution)]
      .filter(Boolean)
      .join(" - "),
  );

  return {
    applicantId: id || `candidate_${index + 1}`,
    ...(fullName ? { fullName } : {}),
    ...(email ? { email } : {}),
    ...(location ? { location } : {}),
    ...(skills.length > 0 ? { skills } : {}),
    ...(yearsExperience > 0 ? { yearsExperience } : {}),
    ...(education.length > 0 ? { education } : {}),
    ...(resumeText ? { resumeText } : {}),
  };
}

export async function screenWithGemini(
  opts: GeminiAuth & {
    model: string;
    topK: number;
    job: ScreeningJobInput;
    candidates: ScreeningCandidateInput[];
  },
) {
  const candidatesCompact = opts.candidates.map((candidate) => ({
    applicantId: candidate.applicantId,
    ...(candidate.fullName ? { fullName: candidate.fullName } : {}),
    ...(candidate.email ? { email: candidate.email } : {}),
    ...(candidate.location ? { location: candidate.location } : {}),
    skills: candidate.skills ?? [],
    ...(typeof candidate.yearsExperience === "number"
      ? { yearsExperience: candidate.yearsExperience }
      : {}),
    education: candidate.education ?? [],
    ...(candidate.resumeText ? { resumeText: candidate.resumeText.slice(0, 4000) } : {}),
  }));

  const prompt = [
    "You are an AI assistant helping a recruiter screen candidates.",
    "Goal: rank and shortlist candidates for the given job, while preserving human-led final decisions.",
    "",
    "Requirements:",
    `- Return ONLY valid JSON with this shape: ${JSON.stringify({ shortlist: [{ applicantId: "id", rank: 1, matchScore: 85, strengths: ["..."], gaps: ["..."], recommendation: "..." }] })}`,
    `- Provide exactly topK=${opts.topK} items unless fewer candidates exist.`,
    "- matchScore must be 0..100.",
    "- strengths and gaps must be concise bullet-like strings.",
    "- recommendation must be recruiter-friendly and action-oriented.",
    "- Be transparent: note missing information as gaps/risks.",
    "- Make sure that all applicants are screened and the results are returned not just the shortlisted",
    "Scoring guidance (suggested weights): skills 40%, experience 30%, education 10%, overall relevance 20%.",
    "",
    "JOB:",
    JSON.stringify(opts.job, null, 2),
    "",
    "CANDIDATES:",
    JSON.stringify(candidatesCompact, null, 2),
  ].join("\n");

  const text = await generateWithGemini({ ...opts, prompt });
  const jsonText = extractFirstJsonObject(text);
  const parsed = JSON.parse(jsonText) as unknown;
  const data = geminiOutputSchema.parse(parsed);

  const sorted = [...data.shortlist]
    .sort((left, right) => left.rank - right.rank)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return { shortlist: sorted.slice(0, Math.max(1, opts.topK)) };
}

export type AssistantJobContext = ScreeningJobInput;
export type AssistantCandidateContext = ScreeningCandidateInput;

export async function assistantWithGemini(
  opts: GeminiAuth & {
    model: string;
    question: string;
    job?: AssistantJobContext;
    candidates?: AssistantCandidateContext[];
  },
) {
  const candidatesCompact = (opts.candidates ?? []).map((candidate) => ({
    applicantId: candidate.applicantId,
    ...(candidate.fullName ? { fullName: candidate.fullName } : {}),
    ...(candidate.email ? { email: candidate.email } : {}),
    ...(candidate.location ? { location: candidate.location } : {}),
    skills: candidate.skills ?? [],
    ...(typeof candidate.yearsExperience === "number"
      ? { yearsExperience: candidate.yearsExperience }
      : {}),
    education: candidate.education ?? [],
    ...(candidate.resumeText ? { resumeText: candidate.resumeText.slice(0, 2500) } : {}),
  }));

  const prompt = [
    "You are an AI assistant helping a recruiter. Be concise, practical, and recruiter-friendly.",
    "Do not hallucinate. If information is missing, say what is missing and what to ask/collect next.",
    "",
    "Output requirements:",
    `- Return ONLY valid JSON with this shape: ${JSON.stringify({ answer: "string", suggestedNextQuestions: ["..."] })}`,
    "- suggestedNextQuestions should be 0-5 short questions.",
    "",
    opts.job
      ? "JOB CONTEXT:\n" + JSON.stringify(opts.job, null, 2)
      : "JOB CONTEXT: (not provided)",
    "",
    candidatesCompact.length > 0
      ? "CANDIDATES CONTEXT:\n" + JSON.stringify(candidatesCompact, null, 2)
      : "CANDIDATES CONTEXT: (not provided)",
    "",
    "USER QUESTION:",
    opts.question,
  ].join("\n");

  const text = await generateWithGemini({ ...opts, prompt });
  const jsonText = extractFirstJsonObject(text);
  const parsed = JSON.parse(jsonText) as unknown;
  return assistantOutputSchema.parse(parsed);
}

export async function parseResumeObjectFieldsWithGemini(
  opts: GeminiAuth & {
    model: string;
    resumeText: string;
    applicantName?: string;
    jobTitle?: string;
  },
): Promise<ParsedResumeObjectFields | null> {
  const resumeText = trimText(opts.resumeText);
  if (!resumeText) {
    return null;
  }

  const prompt = [
    "You are an expert resume parser for recruiter data ingestion.",
    "Extract ONLY object-style candidate profile fields from the resume text.",
    "Do not infer personal primitive fields like first_name, last_name, email, headline, bio, location, or job_title.",
    "Return ONLY valid JSON with this exact top-level shape:",
    JSON.stringify({
      skills: [
        { name: "string", level: "Beginner|Intermediate|Advanced|Expert", yearsOfExperience: 0 },
      ],
      languages: [{ name: "string", proficiency: "Basic|Conversational|Fluent|Native" }],
      experience: [
        {
          company: "string",
          role: "string",
          start_date: "YYYY-MM or YYYY-MM-DD or empty string",
          end_date: "YYYY-MM or YYYY-MM-DD or empty string or Present",
          description: "string",
          technologies: ["string"],
          is_current: false,
        },
      ],
      education: [
        {
          institution: "string",
          degree: "string",
          field_of_study: "string",
          start_year: 0,
          end_year: 0,
        },
      ],
      certifications: [{ name: "string", issuer: "string", issue_date: "YYYY-MM or empty string" }],
      projects: [
        {
          name: "string",
          description: "string",
          technologies: ["string"],
          role: "string",
          link: "string",
          start_date: "YYYY-MM or empty string",
          end_date: "YYYY-MM or empty string",
        },
      ],
      availability: { status: "string", type: "string", start_date: "YYYY-MM-DD or empty string" },
      social_links: { linkedin: "string", github: "string", portfolio: "string" },
    }),
    "Rules:",
    "- If a section is missing, return an empty array/object for that section.",
    "- Keep strings concise and factual. No markdown. No commentary.",
    "- Never include keys outside this schema.",
    "",
    opts.applicantName ? `Applicant context: ${opts.applicantName}` : "",
    opts.jobTitle ? `Job context: ${opts.jobTitle}` : "",
    "",
    "RESUME TEXT:",
    resumeText.slice(0, 16_000),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const text = await generateWithGemini({ ...opts, prompt });
    const parsed = JSON.parse(extractFirstJsonObject(text)) as Record<string, unknown>;

    const availabilityRaw = parsed.availability;
    const availabilityEntry =
      availabilityRaw && typeof availabilityRaw === "object"
        ? (availabilityRaw as Record<string, unknown>)
        : null;
    const availabilityHasSignal = Boolean(
      trimText(availabilityEntry?.status) ||
        trimText(availabilityEntry?.type) ||
        trimText(
          availabilityEntry?.start_date ?? availabilityEntry?.["Start Date"],
        ),
    );

    const socialLinksRaw =
      parsed.social_links && typeof parsed.social_links === "object"
        ? (parsed.social_links as Record<string, unknown>)
        : parsed.socialLinks && typeof parsed.socialLinks === "object"
          ? (parsed.socialLinks as Record<string, unknown>)
          : null;
    const socialLinksHasSignal = Boolean(
      trimText(socialLinksRaw?.linkedin ?? socialLinksRaw?.linked_in) ||
        trimText(socialLinksRaw?.github) ||
        trimText(socialLinksRaw?.portfolio),
    );

    return {
      skills: normalizeSkills(parsed.skills),
      languages: normalizeLanguages(parsed.languages),
      experience: normalizeExperience(parsed.experience),
      education: normalizeEducation(parsed.education),
      certifications: normalizeCertifications(parsed.certifications),
      projects: normalizeProjects(parsed.projects),
      ...(availabilityHasSignal
        ? { availability: normalizeAvailability(availabilityRaw) }
        : {}),
      ...(socialLinksHasSignal
        ? { social_links: normalizeSocialLinks(socialLinksRaw) }
        : {}),
    };
  } catch (error) {
    console.error("Gemini resume object parsing failed:", error);
    return null;
  }
}

export async function enrichScreeningNarratives(input: {
  job: {
    title: string;
    description: string;
    qualifications: string;
    criteria: string[];
  };
  candidates: Array<{
    candidate_id: string;
    candidate_name: string;
    score: number;
    matched: string[];
    missing: string[];
    reasoning: string;
  }>;
}) {
  const auth = resolveAuthOrNull();
  if (!auth || input.candidates.length === 0) {
    return null;
  }

  const prompt = [
    "You are Talvo AI, an explainable recruiter copilot.",
    "Return ONLY valid JSON in this exact shape:",
    JSON.stringify({
      items: [
        {
          candidate_id: "cand_001",
          summary: "One-paragraph recruiter-friendly summary.",
          strengths: ["..."],
          gaps: ["..."],
          recommendation: "Short recruiter-friendly recommendation",
        },
      ],
    }),
    "Keep summaries concise, grounded, and honest.",
    "",
    "JOB:",
    JSON.stringify(input.job, null, 2),
    "",
    "CANDIDATES:",
    JSON.stringify(input.candidates, null, 2),
  ].join("\n");

  try {
    const text = await generateWithGemini({
      ...auth,
      model: trimText(env.GOOGLE_AI_MODEL) || "gemini-1.5-flash",
      prompt,
    });
    const parsed = enrichmentOutputSchema.parse(
      JSON.parse(extractFirstJsonObject(text)),
    );
    return parsed.items;
  } catch (error) {
    console.error("Gemini screening enrichment failed:", error);
    return null;
  }
}

export async function askRecruiterAssistant(input: {
  question: string;
  job?: unknown;
  candidates?: unknown[];
  results?: unknown[];
}) {
  const auth = resolveAuthOrNull();
  if (!auth) {
    return {
      answer:
        "Gemini is not configured right now. Screening can still run with the deterministic engine, but recruiter chat needs GOOGLE_API_KEY.",
      suggestedNextQuestions: [
        "Who are the top candidates for this role?",
        "What are the biggest gaps in the shortlist?",
      ],
    };
  }

  const job = mapJobContext(input.job);
  const candidates = Array.isArray(input.candidates)
    ? input.candidates.map((item, index) => mapCandidateContext(item, index))
    : [];

  const resultsContext =
    Array.isArray(input.results) && input.results.length > 0
      ? `\n\nSCREENING RESULTS CONTEXT (JSON):\n${JSON.stringify(
          input.results.slice(0, 20),
          null,
          2,
        )}`
      : "";

  try {
    const assistantReply = await assistantWithGemini({
      ...auth,
      model: trimText(env.GOOGLE_AI_MODEL) || "gemini-1.5-flash",
      question: `${input.question}${resultsContext}`,
      ...(job ? { job } : {}),
      ...(candidates.length > 0 ? { candidates } : {}),
    });

    return {
      answer: trimText(assistantReply.answer),
      suggestedNextQuestions: assistantReply.suggestedNextQuestions
        .map((item) => trimText(item))
        .filter(Boolean)
        .slice(0, 5),
    };
  } catch (error) {
    console.error("Gemini recruiter assistant failed:", error);
    return {
      answer:
        "I hit a problem while generating the recruiter answer. Please try again in a moment.",
      suggestedNextQuestions: [],
    };
  }
}

export function toLegacyScreeningResult(params: {
  screeningRunId: string;
  jobId: string;
  shortlistItem: {
    applicantId: string;
    rank: number;
    matchScore: number;
    strengths: string[];
    gaps: string[];
    recommendation: string;
  };
  total: number;
}) {
  const score = Math.max(0, Math.min(100, Math.round(params.shortlistItem.matchScore)));
  const percentile = Math.max(
    1,
    Math.round(((params.total - params.shortlistItem.rank + 1) / Math.max(params.total, 1)) * 100),
  );

  return {
    screening_run_id: params.screeningRunId,
    candidate_id: params.shortlistItem.applicantId,
    applicant_id: params.shortlistItem.applicantId,
    job_id: params.jobId,
    evaluated_at: new Date(),
    overall: {
      score,
      grade: gradeFromScore(score),
      verdict: "Shortlisted" as const,
      summary: params.shortlistItem.recommendation,
    },
    dimension_scores: {
      skills_match: {
        score,
        matched: params.shortlistItem.strengths,
        missing: params.shortlistItem.gaps,
        reasoning: "AI-generated shortlist summary.",
      },
      experience_relevance: {
        score,
        total_years: 0,
        relevant_years: 0,
        highlights: [],
        reasoning: "AI-generated shortlist summary.",
      },
      education_fit: {
        score,
        degree_level: "",
        field_relevance: "",
        reasoning: "AI-generated shortlist summary.",
      },
      project_quality: {
        score,
        count: 0,
        highlights: [],
        reasoning: "AI-generated shortlist summary.",
      },
      certifications_value: {
        score,
        count: 0,
        relevant: [],
        reasoning: "AI-generated shortlist summary.",
      },
      language_fit: {
        score,
        required_met: true,
        languages: [],
      },
      availability_fit: {
        score,
        status: "",
        type_match: true,
        earliest_start: null,
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
    rank: params.shortlistItem.rank,
    percentile,
    strengths: params.shortlistItem.strengths,
    gaps: params.shortlistItem.gaps,
    recommendation: params.shortlistItem.recommendation,
  };
}
