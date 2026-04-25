import { Router } from "express";
import { z } from "zod";
import { ApplicantModel } from "../storage/models/Applicant.js";
import { makeUploadMiddleware } from "../lib/upload.js";
import { parseCsvApplicants, parsePdfResume, parseXlsxApplicants } from "../lib/parseApplicants.js";
import { HttpError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
export function applicantsRouter(opts) {
    const router = Router();
    const upload = makeUploadMiddleware({ maxUploadMb: opts.maxUploadMb });
    const applicantProfileSchema = z.object({
        jobId: z.string().optional(),
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        skills: z.array(z.string()).optional(),
        yearsExperience: z.number().optional(),
        education: z.array(z.string()).optional(),
        links: z.array(z.string()).optional(),
        raw: z.unknown().optional()
    });
    // Ingest structured talent profile(s) (from Umurava schema on frontend)
    router.post("/profiles", asyncHandler(async (req, res) => {
        const input = z.array(applicantProfileSchema).min(1).parse(req.body);
        const docs = await ApplicantModel.insertMany(input.map((a) => ({
            source: "profile",
            jobId: a.jobId,
            ...a
        })));
        res.status(201).json({ inserted: docs.length, applicants: docs });
    }));
    // Upload CSV/XLSX with applicant rows
    router.post("/upload/spreadsheet", upload.single("file"), asyncHandler(async (req, res) => {
        const jobId = z.string().optional().parse(req.body.jobId);
        if (!req.file)
            throw new HttpError(400, "Missing file");
        const parsed = req.file.mimetype === "text/csv" ? parseCsvApplicants(req.file.buffer) : await parseXlsxApplicants(req.file.buffer);
        if (!parsed.length)
            throw new HttpError(400, "No applicants found in spreadsheet");
        const docs = await ApplicantModel.insertMany(parsed.map((a) => ({
            source: "upload",
            jobId,
            ...a
        })));
        res.status(201).json({ inserted: docs.length, applicants: docs });
    }));
    // Upload PDF resumes (multiple) and store extracted text
    router.post("/upload/resumes", upload.array("files", 20), asyncHandler(async (req, res) => {
        const jobId = z.string().optional().parse(req.body.jobId);
        const files = req.files;
        if (!files?.length)
            throw new HttpError(400, "Missing files");
        const pdfFiles = files.filter((f) => f.mimetype === "application/pdf");
        if (!pdfFiles.length)
            throw new HttpError(400, "No PDF files found");
        const extracted = await Promise.all(pdfFiles.map(async (f) => ({
            fileName: f.originalname,
            resumeText: await parsePdfResume(f.buffer)
        })));
        const docs = await ApplicantModel.insertMany(extracted.map((e) => ({
            source: "upload",
            jobId,
            fullName: undefined,
            resumeText: e.resumeText,
            raw: { fileName: e.fileName }
        })));
        res.status(201).json({
            inserted: docs.length,
            applicants: docs
        });
    }));
    // Simple listing for a job (or all)
    router.get("/", asyncHandler(async (req, res) => {
        const jobId = z.string().optional().parse(req.query.jobId);
        const q = jobId ? { jobId } : {};
        const docs = await ApplicantModel.find(q).sort({ createdAt: -1 }).limit(500).lean();
        res.json(docs);
    }));
    router.get("/:applicantId", asyncHandler(async (req, res) => {
        const applicantId = z.string().min(1).parse(req.params.applicantId);
        const doc = await ApplicantModel.findById(applicantId).lean();
        if (!doc)
            return res.status(404).json({ error: "Applicant not found" });
        res.json(doc);
    }));
    return router;
}
//# sourceMappingURL=applicants.js.map