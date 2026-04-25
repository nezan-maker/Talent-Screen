import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";
import { z } from "zod";
import env from "../config/env.js";
import { inferExperienceYears, normalizeEducation, normalizeExperience, normalizeSkills, parseJobCriteria, splitList, trimText, } from "../utils/talentProfile.js";
export const geminiOutputSchema = z.object({
    shortlist: z
        .array(z.object({
        applicantId: z.string().min(1),
        rank: z.number().int().min(1),
        matchScore: z.number().min(0).max(100),
        strengths: z.array(z.string()).default([]),
        gaps: z.array(z.string()).default([]),
        recommendation: z.string().min(1),
    }))
        .min(1),
});
const assistantOutputSchema = z.object({
    answer: z.string().min(1),
    suggestedNextQuestions: z.array(z.string().min(1)).default([]),
});
const enrichmentOutputSchema = z.object({
    items: z.array(z.object({
        candidate_id: z.string().min(1),
        summary: z.string().default(""),
        strengths: z.array(z.string()).default([]),
        gaps: z.array(z.string()).default([]),
        recommendation: z.string().default(""),
    })),
});
const MODEL_FALLBACKS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-flash-latest",
    "gemini-2.0-flash",
];
function parseYearsFromText(value) {
    const text = trimText(value);
    const match = text.match(/(\d+)\+?\s*years?/i);
    if (!match) {
        return undefined;
    }
    const years = Number(match[1]);
    return Number.isFinite(years) ? years : undefined;
}
function gradeFromScore(score) {
    if (score >= 85)
        return "A";
    if (score >= 70)
        return "B";
    if (score >= 55)
        return "C";
    return "D";
}
function extractFirstJsonObject(text) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last >= 0 && last > first)
        return text.slice(first, last + 1);
    return text;
}
function uniqueModels(models) {
    return Array.from(new Set(models.map((item) => trimText(item)).filter(Boolean)));
}
function shouldFallbackModel(error) {
    const errorLike = error;
    const status = typeof errorLike.status === "number" ? errorLike.status : Number(errorLike.status);
    const message = trimText(errorLike.message).toLowerCase();
    return (status === 404 ||
        message.includes("not found") ||
        message.includes("not supported for generatecontent") ||
        message.includes("listmodels"));
}
function resolveAuthOrNull(input) {
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
export function resolveGeminiAuth(input) {
    return resolveAuthOrNull(input);
}
export function hasGeminiConfig() {
    return Boolean(resolveAuthOrNull());
}
async function generateWithGemini(opts) {
    if (opts.provider === "ai-studio") {
        const genAI = new GoogleGenerativeAI(opts.apiKey);
        const modelsToTry = uniqueModels([opts.model, ...MODEL_FALLBACKS]);
        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(opts.prompt);
                return result.response.text().trim();
            }
            catch (error) {
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
    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: opts.prompt }],
            },
        ],
    });
    const text = result.response.candidates?.[0]?.content?.parts
        ?.map((part) => (typeof part?.text === "string" ? part.text : ""))
        .join("") ?? "";
    return text.trim();
}
function mapJobContext(rawJob) {
    if (!rawJob || typeof rawJob !== "object") {
        return undefined;
    }
    const job = rawJob;
    const id = trimText(job._id ?? job.job_id ?? job.jobId);
    const title = trimText(job.job_title ?? job.title);
    if (!id && !title) {
        return undefined;
    }
    const criteria = parseJobCriteria(job.job_ai_criteria ?? job.criteria);
    const skills = criteria.map((item) => trimText(item.criteria_string)).filter(Boolean);
    const requirements = splitList([job.requirements, job.job_qualifications, job.job_responsibilities]
        .map((value) => trimText(value))
        .filter(Boolean)
        .join("\n"));
    const education = splitList(job.education ?? job.job_qualifications);
    const notes = trimText(job.notes ?? job.job_description);
    const experienceYearsMin = typeof job.experienceYearsMin === "number"
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
function mapCandidateContext(rawCandidate, index) {
    const candidate = rawCandidate && typeof rawCandidate === "object"
        ? rawCandidate
        : {};
    const id = trimText(candidate.applicantId ??
        candidate.applicant_id ??
        candidate.candidate_id ??
        candidate._id);
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
    const education = normalizeEducation(candidate.education).map((item) => [trimText(item.degree), trimText(item.field_of_study), trimText(item.institution)]
        .filter(Boolean)
        .join(" - "));
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
export async function screenWithGemini(opts) {
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
    const parsed = JSON.parse(jsonText);
    const data = geminiOutputSchema.parse(parsed);
    const sorted = [...data.shortlist]
        .sort((left, right) => left.rank - right.rank)
        .map((item, index) => ({ ...item, rank: index + 1 }));
    return { shortlist: sorted.slice(0, Math.max(1, opts.topK)) };
}
export async function assistantWithGemini(opts) {
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
    const parsed = JSON.parse(jsonText);
    return assistantOutputSchema.parse(parsed);
}
export async function enrichScreeningNarratives(input) {
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
        const parsed = enrichmentOutputSchema.parse(JSON.parse(extractFirstJsonObject(text)));
        return parsed.items;
    }
    catch (error) {
        console.error("Gemini screening enrichment failed:", error);
        return null;
    }
}
export async function askRecruiterAssistant(input) {
    const auth = resolveAuthOrNull();
    if (!auth) {
        return {
            answer: "Gemini is not configured right now. Screening can still run with the deterministic engine, but recruiter chat needs GOOGLE_API_KEY.",
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
    const resultsContext = Array.isArray(input.results) && input.results.length > 0
        ? `\n\nSCREENING RESULTS CONTEXT (JSON):\n${JSON.stringify(input.results.slice(0, 20), null, 2)}`
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
    }
    catch (error) {
        console.error("Gemini recruiter assistant failed:", error);
        return {
            answer: "I hit a problem while generating the recruiter answer. Please try again in a moment.",
            suggestedNextQuestions: [],
        };
    }
}
export function toLegacyScreeningResult(params) {
    const score = Math.max(0, Math.min(100, Math.round(params.shortlistItem.matchScore)));
    const percentile = Math.max(1, Math.round(((params.total - params.shortlistItem.rank + 1) / Math.max(params.total, 1)) * 100));
    return {
        screening_run_id: params.screeningRunId,
        candidate_id: params.shortlistItem.applicantId,
        applicant_id: params.shortlistItem.applicantId,
        job_id: params.jobId,
        evaluated_at: new Date(),
        overall: {
            score,
            grade: gradeFromScore(score),
            verdict: "Shortlisted",
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
//# sourceMappingURL=gemini.js.map