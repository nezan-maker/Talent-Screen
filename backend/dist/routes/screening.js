import { Router } from "express";
import { z } from "zod";
import { JobModel } from "../storage/models/Job.js";
import { ApplicantModel } from "../storage/models/Applicant.js";
import { ScreeningRunModel } from "../storage/models/ScreeningRun.js";
import { ScreeningResultModel } from "../storage/models/ScreeningResult.js";
import { HttpError } from "../middleware/errorHandler.js";
import { screenWithGemini } from "../lib/gemini.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
export function screeningRouter(opts) {
    const router = Router();
    // List available Gemini API models (AI Studio key only)
    router.get("/models", asyncHandler(async (_req, res) => {
        if (!opts.aiStudioApiKey) {
            throw new HttpError(400, "GEMINI_API_KEY is required to list models (AI Studio provider).");
        }
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${opts.aiStudioApiKey}`);
        const text = await r.text();
        if (!r.ok)
            throw new HttpError(r.status, "Failed to list models", text);
        res.type("json").send(text);
    }));
    const triggerSchema = z.object({
        jobId: z.string().min(1),
        applicantIds: z.array(z.string().min(1)).optional(),
        topK: z.number().int().min(1).max(50).default(10)
    });
    // Trigger screening: computes and persists results
    router.post("/run", asyncHandler(async (req, res) => {
        const input = triggerSchema.parse(req.body);
        const job = await JobModel.findById(input.jobId).lean();
        if (!job)
            throw new HttpError(404, "Job not found");
        const applicants = await ApplicantModel.find(input.applicantIds?.length ? { _id: { $in: input.applicantIds } } : { jobId: input.jobId })
            .limit(500)
            .lean();
        if (!applicants.length)
            throw new HttpError(400, "No applicants found for this job");
        const topK = Math.min(input.topK, applicants.length);
        const run = await ScreeningRunModel.create({
            jobId: input.jobId,
            applicantIds: applicants.map((a) => a._id),
            topK,
            status: "queued",
            model: opts.geminiModel
        });
        try {
            const ai = await screenWithGemini({
                model: opts.geminiModel,
                topK,
                ...(opts.aiStudioApiKey
                    ? { provider: "ai-studio", apiKey: opts.aiStudioApiKey }
                    : {
                        provider: "vertex",
                        projectId: opts.vertexProjectId,
                        location: opts.vertexLocation
                    }),
                job: {
                    jobId: String(job._id),
                    title: job.title,
                    requirements: job.requirements ?? [],
                    skills: job.skills ?? [],
                    experienceYearsMin: job.experienceYearsMin ?? undefined,
                    education: job.education ?? [],
                    notes: job.notes ?? undefined
                },
                candidates: applicants.map((a) => ({
                    applicantId: String(a._id),
                    fullName: a.fullName ?? undefined,
                    email: a.email ?? undefined,
                    location: a.location ?? undefined,
                    skills: a.skills ?? [],
                    yearsExperience: a.yearsExperience ?? undefined,
                    education: a.education ?? [],
                    resumeText: a.resumeText ?? undefined
                }))
            });
            // replace existing results for this run (should be none)
            await ScreeningResultModel.insertMany(ai.shortlist.map((s) => ({
                screeningRunId: run._id,
                jobId: input.jobId,
                applicantId: s.applicantId,
                rank: s.rank,
                matchScore: s.matchScore,
                strengths: s.strengths,
                gaps: s.gaps,
                recommendation: s.recommendation
            })));
            await ScreeningRunModel.findByIdAndUpdate(run._id, { status: "completed" });
            const results = await ScreeningResultModel.find({ screeningRunId: run._id }).sort({ rank: 1 }).lean();
            res.status(201).json({ runId: run._id, results });
        }
        catch (e) {
            await ScreeningRunModel.findByIdAndUpdate(run._id, {
                status: "failed",
                error: e instanceof Error ? e.message : "Unknown error"
            });
            throw e;
        }
    }));
    // List runs for a job
    router.get("/runs", asyncHandler(async (req, res) => {
        const jobId = z.string().optional().parse(req.query.jobId);
        const q = jobId ? { jobId } : {};
        const docs = await ScreeningRunModel.find(q).sort({ createdAt: -1 }).limit(200).lean();
        res.json(docs);
    }));
    // Get results for a run (ranked shortlist + reasoning)
    router.get("/runs/:runId/results", asyncHandler(async (req, res) => {
        const runId = z.string().min(1).parse(req.params.runId);
        const run = await ScreeningRunModel.findById(runId).lean();
        if (!run)
            throw new HttpError(404, "Run not found");
        const results = await ScreeningResultModel.find({ screeningRunId: runId }).sort({ rank: 1 }).lean();
        res.json({ run, results });
    }));
    return router;
}
//# sourceMappingURL=screening.js.map