import { GoogleGenerativeAI } from "@google/generative-ai";
<<<<<<< HEAD
import env from "../config/env.js";
=======
import { VertexAI } from "@google-cloud/vertexai";
import { geminiOutputSchema } from "../validations/functionValidations.js";
import type {
  Skill,
  Education,
  Work,
  Language,
  Project,
  Social,
  Certification,
  Availability,
} from "../controllers/applicantControl.js";
import { z } from "zod";

export type ScreeningCandidateInput = {
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  location: string;
  skills: Skill[];
  languages: Language[];
  experience: Work[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  availability: Availability;
  social_links: Social;
};

export type ScreeningJobInput =
  | {
      job_id: string;
      title: string;
      requirements: string[];
      skills: string[];
      experience?: number;
      education: string[];
      notes?: string[] | null | undefined;
    }
  | undefined;

type AiStudioAuth = {
  provider: "ai-studio";
  apiKey: string;
};

type VertexAuth = {
  provider: "vertex";
  projectId: string;
  location: string;
};
>>>>>>> a0dac98 (Refined the screening ai service)

function extractFirstJsonObject(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
<<<<<<< HEAD
  if (first >= 0 && last > first) {
    return text.slice(first, last + 1);
  }

  return text;
}

export function hasGeminiConfig() {
  return Boolean(env.GOOGLE_API_KEY);
}

async function runGeminiPrompt(prompt: string) {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is missing");
  }

  const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({
    model: env.GOOGLE_AI_MODEL || "gemini-2.0-flash",
  });
  const response = await model.generateContent(prompt);
  return response.response.text().trim();
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
  if (!hasGeminiConfig() || input.candidates.length === 0) {
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
    const text = await runGeminiPrompt(prompt);
    const parsed = JSON.parse(extractFirstJsonObject(text)) as {
      items?: Array<{
        candidate_id?: string;
        summary?: string;
        strengths?: string[];
        gaps?: string[];
        recommendation?: string;
      }>;
    };

    return Array.isArray(parsed.items) ? parsed.items : null;
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
  if (!hasGeminiConfig()) {
    return {
      answer:
        "Gemini is not configured right now. Screening can still run with the deterministic engine, but recruiter chat needs GOOGLE_API_KEY.",
      suggestedNextQuestions: [
        "Who are the top candidates for this role?",
        "What are the biggest gaps in the shortlist?",
      ],
    };
  }

  const prompt = [
    "You are Talvo AI, a recruiter assistant.",
    "Answer clearly and practically. Do not hallucinate missing facts.",
    "Return ONLY valid JSON in this shape:",
    JSON.stringify({
      answer: "string",
      suggestedNextQuestions: ["string"],
    }),
    "",
    "JOB CONTEXT:",
    JSON.stringify(input.job ?? null, null, 2),
    "",
    "CANDIDATE CONTEXT:",
    JSON.stringify(input.candidates ?? [], null, 2),
    "",
    "SCREENING RESULTS:",
    JSON.stringify(input.results ?? [], null, 2),
    "",
    "USER QUESTION:",
    input.question,
  ].join("\n");

  try {
    const text = await runGeminiPrompt(prompt);
    const parsed = JSON.parse(extractFirstJsonObject(text)) as {
      answer?: string;
      suggestedNextQuestions?: string[];
    };

    return {
      answer:
        typeof parsed.answer === "string" && parsed.answer.trim()
          ? parsed.answer.trim()
          : "I could not generate a grounded answer for that question.",
      suggestedNextQuestions: Array.isArray(parsed.suggestedNextQuestions)
        ? parsed.suggestedNextQuestions
            .map((item) => String(item).trim())
            .filter(Boolean)
            .slice(0, 5)
        : [],
    };
  } catch (error) {
    console.error("Gemini recruiter assistant failed:", error);
    return {
      answer:
        "I hit a problem while generating the recruiter answer. Please try again in a moment.",
      suggestedNextQuestions: [],
    };
  }
=======
  if (first >= 0 && last >= 0 && last > first)
    return text.slice(first, last + 1);
  return text;
}

async function generateWithGemini(
  opts: (AiStudioAuth | VertexAuth) & {
    model: string;
    prompt: string;
  },
) {
  if (opts.provider === "ai-studio") {
    const genAI = new GoogleGenerativeAI(opts.apiKey);
    const tryModels = [
      opts.model,
      "gemini-flash-latest",
      "gemini-2.0-flash",
    ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

    let lastErr: unknown = undefined;
    for (const m of tryModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent(opts.prompt);
        return result.response.text().trim();
      } catch (e: any) {
        lastErr = e;
        const status = typeof e?.status === "number" ? e.status : undefined;
        const msg = typeof e?.message === "string" ? e.message : "";
        // Only fallback on model-not-found style failures
        if (
          status === 404 ||
          msg.includes("not found") ||
          msg.includes("ListModels")
        )
          continue;
        throw e;
      }
    }
    throw lastErr;
  }

  const vertex = new VertexAI({
    project: opts.projectId,
    location: opts.location,
  });
  const model = vertex.getGenerativeModel({ model: opts.model });
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: opts.prompt }],
      },
    ],
  });

  const text =
    result.response.candidates?.[0]?.content?.parts
      ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join("") ?? "";
  return text.trim();
}

export async function screenWithGemini(
  opts: (AiStudioAuth | VertexAuth) & {
    model: string;
    topK: number;
    job: ScreeningJobInput;
    candidates: ScreeningCandidateInput[];
  },
) {
  // Keep resumes short to avoid huge prompts; still keep enough signal.
  const candidatesCompact = opts.candidates.map((c) => ({
    applicantId: c.applicant_id,
    fullName: c.applicant_name,
    email: c.applicant_email,
    location: c.location,
    skills: c.skills ?? [],
    yearsExperience: c.experience,
    education: c.education ?? [],
    languages: c.languages,
    projects: c.projects,
    certifications: c.certifications,
    availability: c.availability,
    social_links: c.social_links,
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
    "- recommendation must be recruiter-friendly and action-oriented (e.g. 'Strong interview', 'Proceed with caution', 'Not recommended').",
    "- Be transparent: note missing information as gaps/risks.",
    "",
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

  // Normalize ranks (ensure 1..N and stable order)
  const sorted = [...data.shortlist]
    .sort((a, b) => a.rank - b.rank)
    .map((x, i) => ({ ...x, rank: i + 1 }));
  return { shortlist: sorted };
}

export type AssistantJobContext = ScreeningJobInput;
export type AssistantCandidateContext = ScreeningCandidateInput;

const assistantOutputSchema = z.object({
  answer: z.string().min(1),
  suggestedNextQuestions: z.array(z.string().min(1)).default([]),
});

export async function assistantWithGemini(
  opts: (AiStudioAuth | VertexAuth) & {
    model: string;
    question: string;
    job?: AssistantJobContext;
    candidates?: AssistantCandidateContext[];
  },
) {
  const candidatesCompact = (opts.candidates ?? []).map((c) => ({
    applicantId: c.applicant_id,
    fullName: c.applicant_name,
    email: c.applicant_email,
    location: c.location,
    skills: c.skills ?? [],
    yearsExperience: c.experience,
    education: c.education ?? [],
    languages: c.languages,
    projects: c.projects,
    certifications: c.certifications,
    availability: c.availability,
    social_links: c.social_links,
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
    candidatesCompact.length
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
>>>>>>> a0dac98 (Refined the screening ai service)
}
