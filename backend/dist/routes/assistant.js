import { Router } from "express";
import { z } from "zod";
import { JobModel } from "../storage/models/Job.js";
import { ApplicantModel } from "../storage/models/Applicant.js";
import { HttpError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { assistantWithGemini } from "../lib/gemini.js";
export function assistantRouter(opts) {
    const router = Router();
    const askSchema = z.object({
        jobId: z.string().min(1).optional(),
        applicantIds: z.array(z.string().min(1)).optional(),
        maxApplicants: z.number().int().min(1).max(200).default(50),
        question: z.string().min(1).max(4000)
    });
    router.post("/ask", asyncHandler(async (req, res) => {
        const input = askSchema.parse(req.body);
        const job = input.jobId ? await JobModel.findById(input.jobId).lean() : null;
        if (input.jobId && !job)
            throw new HttpError(404, "Job not found");
        const applicants = await ApplicantModel.find(input.applicantIds?.length ? { _id: { $in: input.applicantIds } } : input.jobId ? { jobId: input.jobId } : {})
            .limit(input.maxApplicants)
            .lean();
        const ai = await assistantWithGemini({
            model: opts.geminiModel,
            question: input.question,
            ...(opts.aiStudioApiKey
                ? { provider: "ai-studio", apiKey: opts.aiStudioApiKey }
                : {
                    provider: "vertex",
                    projectId: opts.vertexProjectId,
                    location: opts.vertexLocation
                }),
            job: job
                ? {
                    jobId: String(job._id),
                    title: job.title,
                    requirements: job.requirements ?? [],
                    skills: job.skills ?? [],
                    experienceYearsMin: job.experienceYearsMin ?? undefined,
                    education: job.education ?? [],
                    notes: job.notes ?? undefined
                }
                : undefined,
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
        res.json({
            answer: ai.answer,
            suggestedNextQuestions: ai.suggestedNextQuestions,
            context: {
                jobId: input.jobId ?? null,
                applicantCount: applicants.length
            }
        });
    }));
    return router;
}
//# sourceMappingURL=assistant.js.map