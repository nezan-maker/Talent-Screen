import { Router } from "express";
import { z } from "zod";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import { assistantWithGemini, resolveGeminiAuth, } from "../lib/gemini.js";
import { inferExperienceYears, normalizeEducation, normalizeExperience, normalizeSkills, parseJobCriteria, splitList, trimText, } from "../utils/talentProfile.js";
import env from "../config/env.js";
const askSchema = z.object({
    jobId: z.string().min(1).optional(),
    applicantIds: z.array(z.string().min(1)).optional(),
    maxApplicants: z.number().int().min(1).max(200).default(50),
    question: z.string().min(1).max(4000),
});
function parseYearsFromText(value) {
    const match = trimText(value).match(/(\d+)\+?\s*years?/i);
    if (!match) {
        return undefined;
    }
    const years = Number(match[1]);
    return Number.isFinite(years) ? years : undefined;
}
function mapJob(job) {
    const criteria = parseJobCriteria(job?.job_ai_criteria);
    const skills = criteria.map((item) => trimText(item.criteria_string)).filter(Boolean);
    const requirements = splitList([job?.job_qualifications, job?.job_responsibilities, job?.job_description]
        .map((item) => trimText(item))
        .filter(Boolean)
        .join("\n"));
    const education = splitList(job?.job_qualifications);
    const notes = trimText(job?.job_description);
    const experienceYearsMin = parseYearsFromText(job?.job_experience_required);
    return {
        jobId: trimText(job?._id),
        title: trimText(job?.job_title) || "Role",
        requirements,
        skills,
        ...(typeof experienceYearsMin === "number" ? { experienceYearsMin } : {}),
        education,
        ...(notes ? { notes } : {}),
    };
}
function mapCandidate(candidate, index) {
    const skills = normalizeSkills(candidate?.skills)
        .map((item) => trimText(item.name))
        .filter(Boolean);
    const experience = normalizeExperience(candidate?.experience);
    const yearsExperience = inferExperienceYears(experience);
    const education = normalizeEducation(candidate?.education).map((item) => [trimText(item.degree), trimText(item.field_of_study), trimText(item.institution)]
        .filter(Boolean)
        .join(" - "));
    const email = trimText(candidate?.applicant_email ?? candidate?.email);
    const location = trimText(candidate?.location);
    const fullName = trimText(candidate?.applicant_name);
    const resumeText = trimText(candidate?.resume_text);
    const applicantId = trimText(candidate?._id) || `candidate_${index + 1}`;
    return {
        applicantId,
        ...(fullName ? { fullName } : {}),
        ...(email ? { email } : {}),
        ...(location ? { location } : {}),
        ...(skills.length > 0 ? { skills } : {}),
        ...(yearsExperience > 0 ? { yearsExperience } : {}),
        ...(education.length > 0 ? { education } : {}),
        ...(resumeText ? { resumeText } : {}),
    };
}
export default function assistantRouter(options = {}) {
    const router = Router();
    router.post("/ask", async (req, res) => {
        try {
            const input = askSchema.parse(req.body);
            const auth = resolveGeminiAuth({
                ...(options.aiStudioApiKey ? { aiStudioApiKey: options.aiStudioApiKey } : {}),
                ...(options.vertexProjectId ? { vertexProjectId: options.vertexProjectId } : {}),
                ...(options.vertexLocation ? { vertexLocation: options.vertexLocation } : {}),
            });
            if (!auth) {
                return res.status(400).json({
                    data_error: "Gemini is not configured. Set GOOGLE_API_KEY or Vertex project/location values.",
                });
            }
            const job = input.jobId ? await Job.findById(input.jobId).lean() : null;
            if (input.jobId && !job) {
                return res.status(404).json({ data_error: "Job not found" });
            }
            const applicantQuery = input.applicantIds?.length
                ? { _id: { $in: input.applicantIds } }
                : job
                    ? { $or: [{ job_id: trimText(job._id) }, { job_title: trimText(job.job_title) }] }
                    : {};
            const applicants = await Applicant.find(applicantQuery)
                .limit(input.maxApplicants)
                .lean();
            const model = trimText(options.geminiModel ?? env.GOOGLE_AI_MODEL) || "gemini-1.5-flash";
            const reply = await assistantWithGemini({
                ...auth,
                model,
                question: input.question,
                ...(job ? { job: mapJob(job) } : {}),
                ...(applicants.length > 0
                    ? { candidates: applicants.map((applicant, index) => mapCandidate(applicant, index)) }
                    : {}),
            });
            return res.status(200).json({
                answer: reply.answer,
                suggestedNextQuestions: reply.suggestedNextQuestions,
                context: {
                    jobId: input.jobId ?? null,
                    applicantCount: applicants.length,
                },
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ input_error: "Input requirements not fulfilled" });
            }
            console.error("Error in assistant /ask route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    return router;
}
//# sourceMappingURL=assistant.js.map