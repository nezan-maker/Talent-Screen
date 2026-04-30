import { Router } from "express";
import { z } from "zod";
import Job from "../models/Job.js";
import Applicant from "../models/Applicant.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import { resolveGeminiAuth, screenWithGemini, toLegacyScreeningResult, } from "../lib/gemini.js";
import { inferExperienceYears, normalizeEducation, normalizeExperience, normalizeSkills, parseJobCriteria, splitList, trimText, } from "../utils/talentProfile.js";
import env from "../config/env.js";
const runSchema = z.object({
    jobId: z.string().min(1),
    applicantIds: z.array(z.string().min(1)).optional(),
    topK: z.number().int().min(1).max(50).default(10),
});
const listRunsSchema = z.object({
    jobId: z.string().min(1).optional(),
});
function mapJob(job) {
    const criteria = parseJobCriteria(job?.job_ai_criteria);
    const skills = criteria.map((item) => trimText(item.criteria_string)).filter(Boolean);
    const requirements = splitList([job?.job_qualifications, job?.job_responsibilities, job?.job_description]
        .map((item) => trimText(item))
        .filter(Boolean)
        .join("\n"));
    const education = splitList(job?.job_qualifications);
    const notes = trimText(job?.job_description);
    const yearsMatch = trimText(job?.job_experience_required).match(/(\d+)\+?\s*years?/i);
    const years = yearsMatch ? Number(yearsMatch[1]) : undefined;
    return {
        jobId: trimText(job?._id),
        title: trimText(job?.job_title) || "Role",
        requirements,
        skills,
        minimum_marks: typeof job?.minimum_marks === "number" ? job.minimum_marks : 70,
        ...(typeof years === "number" && Number.isFinite(years) ? { experienceYearsMin: years } : {}),
        education,
        ...(notes ? { notes } : {}),
    };
}
function mapCandidate(applicant, index) {
    const skills = normalizeSkills(applicant?.skills)
        .map((item) => trimText(item.name))
        .filter(Boolean);
    const experience = normalizeExperience(applicant?.experience);
    const yearsExperience = inferExperienceYears(experience);
    const education = normalizeEducation(applicant?.education).map((item) => [trimText(item.degree), trimText(item.field_of_study), trimText(item.institution)]
        .filter(Boolean)
        .join(" - "));
    const fullName = trimText(applicant?.applicant_name);
    const email = trimText(applicant?.applicant_email ?? applicant?.email);
    const location = trimText(applicant?.location);
    const resumeText = trimText(applicant?.resume_text);
    return {
        applicantId: trimText(applicant?._id) || `candidate_${index + 1}`,
        ...(fullName ? { fullName } : {}),
        ...(email ? { email } : {}),
        ...(location ? { location } : {}),
        ...(skills.length > 0 ? { skills } : {}),
        ...(yearsExperience > 0 ? { yearsExperience } : {}),
        ...(education.length > 0 ? { education } : {}),
        ...(resumeText ? { resumeText } : {}),
    };
}
export default function screeningRouter(options = {}) {
    const router = Router();
    router.get("/models", async (_req, res) => {
        const apiKey = trimText(options.aiStudioApiKey ?? env.GOOGLE_API_KEY);
        if (!apiKey) {
            return res.status(400).json({
                data_error: "GOOGLE_API_KEY is required to list models",
            });
        }
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const text = await response.text();
            if (!response.ok) {
                return res.status(response.status).json({ ai_error: text });
            }
            return res.status(200).json(JSON.parse(text));
        }
        catch (error) {
            console.error("Error in screening/models route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    router.post("/run", async (req, res) => {
        let runId = "";
        try {
            const input = runSchema.parse(req.body);
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
            const job = await Job.findById(input.jobId).lean();
            if (!job) {
                return res.status(404).json({ data_error: "Job not found" });
            }
            const applicantQuery = input.applicantIds?.length
                ? { _id: { $in: input.applicantIds } }
                : { $or: [{ job_id: input.jobId }, { job_title: trimText(job.job_title) }] };
            const applicants = await Applicant.find(applicantQuery)
                .limit(500)
                .lean();
            if (applicants.length === 0) {
                return res.status(400).json({ data_error: "No applicants found for this job" });
            }
            const topK = Math.min(input.topK, applicants.length);
            const run = await ScreeningRunModel.create({
                job_id: input.jobId,
                job_title: trimText(job.job_title),
                applicant_ids: applicants.map((item) => trimText(item._id)),
                topK,
                status: "running",
                model: trimText(options.geminiModel ?? env.GOOGLE_AI_MODEL) || "gemini-1.5-flash",
                started_at: new Date(),
            });
            runId = trimText(run._id);
            const ai = await screenWithGemini({
                ...auth,
                model: trimText(options.geminiModel ?? env.GOOGLE_AI_MODEL) || "gemini-1.5-flash",
                topK,
                job: mapJob(job),
                candidates: applicants.map((applicant, index) => mapCandidate(applicant, index)),
            });
            await ScreeningResultModel.deleteMany({ screening_run_id: run._id });
            const legacyResults = ai.shortlist.map((item) => toLegacyScreeningResult({
                screeningRunId: trimText(run._id),
                jobId: input.jobId,
                shortlistItem: item,
                total: ai.shortlist.length,
            }));
            await ScreeningResultModel.insertMany(legacyResults);
            await ScreeningRunModel.findByIdAndUpdate(run._id, {
                status: "completed",
                completed_at: new Date(),
                result_count: legacyResults.length,
            });
            const storedResults = await ScreeningResultModel.find({
                screening_run_id: run._id,
            })
                .sort({ rank: 1 })
                .lean();
            return res.status(201).json({
                runId: run._id,
                results: storedResults,
            });
        }
        catch (error) {
            if (runId) {
                await ScreeningRunModel.findByIdAndUpdate(runId, {
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ input_error: "Input requirements not fulfilled" });
            }
            console.error("Error in screening/run route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    router.get("/runs", async (req, res) => {
        try {
            const parsedQuery = listRunsSchema.parse(req.query);
            const query = parsedQuery.jobId ? { job_id: parsedQuery.jobId } : {};
            const runs = await ScreeningRunModel.find(query)
                .sort({ createdAt: -1 })
                .limit(200)
                .lean();
            return res.status(200).json({ runs });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ input_error: "Input requirements not fulfilled" });
            }
            console.error("Error in screening/runs route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    router.get("/runs/:runId/results", async (req, res) => {
        try {
            const runId = z.string().min(1).parse(req.params.runId);
            const run = await ScreeningRunModel.findById(runId).lean();
            if (!run) {
                return res.status(404).json({ data_error: "Run not found" });
            }
            const results = await ScreeningResultModel.find({
                screening_run_id: runId,
            })
                .sort({ rank: 1 })
                .lean();
            return res.status(200).json({ run, results });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ input_error: "Input requirements not fulfilled" });
            }
            console.error("Error in screening/runs/:runId/results route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    router.get("/jobs/:jobId/results", async (req, res) => {
        try {
            const jobId = z.string().min(1).parse(req.params.jobId);
            const latestRun = await ScreeningRunModel.findOne({ job_id: jobId })
                .sort({ createdAt: -1 })
                .lean();
            if (!latestRun) {
                return res.status(404).json({ data_error: "No screening run found" });
            }
            const results = await ScreeningResultModel.find({
                screening_run_id: latestRun._id,
            })
                .sort({ rank: 1 })
                .lean();
            return res.status(200).json({
                run: latestRun,
                results,
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ input_error: "Input requirements not fulfilled" });
            }
            console.error("Error in screening/jobs/:jobId/results route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    return router;
}
//# sourceMappingURL=screening.js.map