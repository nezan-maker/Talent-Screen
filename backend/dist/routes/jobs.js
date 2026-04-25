import { Router } from "express";
import { z } from "zod";
import { JobModel } from "../storage/models/Job.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
export const jobsRouter = Router();
const jobInputSchema = z.object({
    title: z.string().min(1),
    department: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.string().optional(),
    seniority: z.string().optional(),
    requirements: z.array(z.string().min(1)).default([]),
    skills: z.array(z.string().min(1)).default([]),
    experienceYearsMin: z.number().min(0).optional(),
    education: z.array(z.string().min(1)).default([]),
    notes: z.string().optional()
});
jobsRouter.post("/", asyncHandler(async (req, res) => {
    const input = jobInputSchema.parse(req.body);
    const doc = await JobModel.create(input);
    res.status(201).json(doc);
}));
jobsRouter.get("/", asyncHandler(async (_req, res) => {
    const docs = await JobModel.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(docs);
}));
jobsRouter.get("/:jobId", asyncHandler(async (req, res) => {
    const jobId = z.string().min(1).parse(req.params.jobId);
    const doc = await JobModel.findById(jobId).lean();
    if (!doc)
        return res.status(404).json({ error: "Job not found" });
    res.json(doc);
}));
jobsRouter.patch("/:jobId", asyncHandler(async (req, res) => {
    const jobId = z.string().min(1).parse(req.params.jobId);
    const input = jobInputSchema.partial().parse(req.body);
    const doc = await JobModel.findByIdAndUpdate(jobId, input, { new: true }).lean();
    if (!doc)
        return res.status(404).json({ error: "Job not found" });
    res.json(doc);
}));
jobsRouter.delete("/:jobId", asyncHandler(async (req, res) => {
    const jobId = z.string().min(1).parse(req.params.jobId);
    const deleted = await JobModel.findByIdAndDelete(jobId).lean();
    if (!deleted)
        return res.status(404).json({ error: "Job not found" });
    res.json({ ok: true });
}));
//# sourceMappingURL=jobs.js.map