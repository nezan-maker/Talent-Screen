import { Router, type Request, type Response } from "express";
<<<<<<< HEAD
import Job from "../models/Job.js";
import Applicant from "../models/Applicant.js";
import env from "../config/env.js";
import { middleAuth } from "../middlewares/authMiddleware.js";
import {
  askAssistant,
  getLatestJobResults,
  getScreeningRunById,
  getScreeningRuns,
  runScreening,
} from "../controllers/screeningApi.js";

const router = Router();

router.use(middleAuth);

router.get("/models", async (_req: Request, res: Response) => {
  if (!env.GOOGLE_API_KEY) {
    return res.status(400).json({
      data_error: "GOOGLE_API_KEY is required to list Gemini models",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_API_KEY}`,
    );
    const text = await response.text();
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ ai_error: `Could not list models: ${text}` });
    }

    const parsed = JSON.parse(text) as { models?: unknown[] };
    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Error in GET /ai/models:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
});

router.post("/run", runScreening);
router.get("/runs", getScreeningRuns);
router.get("/runs/:runId", getScreeningRunById);
router.get("/jobs/:jobId/results", getLatestJobResults);
router.post("/ask", askAssistant);
router.get("/context/:jobId", async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.jobId).lean();
    if (!job) {
      return res.status(404).json({ data_error: "Job not found" });
    }

    const candidates = await Applicant.find({ job_id: req.params.jobId } as any).lean();
    return res.status(200).json({ job, candidates });
  } catch (error) {
    console.error("Error in GET /ai/context/:jobId:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
});

export default router;
=======
import { z } from "zod";
import Job from "../models/Job.js";
import Applicant from "../models/Applicant.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import { screenWithGemini, assistantWithGemini } from "../lib/gemini.js";
import env from "../config/env.js";
import { controlDebug } from "../controllers/authControl.js";
import {
  triggerSchema,
  askSchema,
} from "../validations/functionValidations.js";

if (
  !env.GOOGLE_API_KEY ||
  !env.VERTEX_PROJECT_ID ||
  !env.VERTEX_LOCATION ||
  !env.GOOGLE_AI_MODEL
) {
  throw new Error("Could not load environment variables");
}

const router = Router();

const getModels = async (req: Request, res: Response) => {
  if (!env.GOOGLE_API_KEY) {
    return res
      .status(400)
      .json({ data_error: "GEMINI_API_KEY is requires to list models" });
  }
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_API_KEY}`,
  );
  const text = await r.text();
  if (!r.ok) {
    return res
      .status(r.status)
      .json({ ai_error: "Could not list models" + r.text });
  }
  res.json(text);
};

const runModel = async (req: Request, res: Response) => {
  try {
    if (
      !env.GOOGLE_API_KEY ||
      !env.GOOGLE_AI_MODEL ||
      env.VERTEX_PROJECT_ID ||
      env.VERTEX_LOCATION
    ) {
      throw new Error("Could not load environment variables");
    }
    const input = triggerSchema.parse(req.body);
    const job = await Job.findById(input.job_id).lean();
    if (!job) {
      return res.status(404).json({ missing_data_error: "No jobs found" });
    }

    const applicants = await Applicant.find(
      input.applicant_ids?.length
        ? { _id: { $in: input.applicant_ids } }
        : { jobId: input.job_id },
    )
      .limit(500)
      .lean();

    if (!applicants.length) {
      return res
        .status(404)
        .json({ data_error: "No applicants found for this job" });
    }

    const topK = Math.min(input.topK, applicants.length);
    const run = await ScreeningRunModel.create({
      job_id: input.job_id,
      applicants_ids: applicants.map((a) => a._id),
      topK,
      status: "queued",
      model: env.GOOGLE_AI_MODEL,
    });

    try {
      const ai = await screenWithGemini({
        model: env.GOOGLE_AI_MODEL,
        topK,
        ...(env.GOOGLE_API_KEY
          ? { provider: "ai-studio" as const, apiKey: env.GOOGLE_API_KEY }
          : {
              provider: "vertex" as const,
              projectId: env.VERTEX_PROJECT_ID!,
              location: env.VERTEX_LOCATION!,
            }),
        job: {
          job_id: String(job._id),
          title: job.job_title,
          requirements: job.job_requirements ?? [],
          skills: job.job_skills ?? [],
          experience: job.job_experience ?? undefined,
          education: job.job_qualifications ?? [],
          notes: job.job_notes ?? undefined,
        },
        candidates: applicants.map((a) => ({
          applicant_id: String(a._id),
          applicant_name: a.applicant_name,
          applicant_email: a.applicant_email,
          location: a.location,
          skills: (a.skills as string[] | undefined) ?? [],
          experience: a.experience,
          education: (a.education as string[] | undefined) ?? [],
          resume_text: a.resume_text,
        })),
      });

      await ScreeningResultModel.insertMany(
        ai.shortlist.map((s) => ({
          screening_run_id: run._id,
          job_id: input.job_id,
          applicant_id: s.applicant_id,
          rank: s.rank,
          match_score: s.match_score,
          strengths: s.strengths,
          gaps: s.gaps,
          recommendation: s.recommendation,
        })),
      );

      await ScreeningRunModel.findByIdAndUpdate(run._id, {
        status: "completed",
      });
      const results = await ScreeningResultModel.find({
        screeningRunId: run._id,
      })
        .sort({ rank: 1 })
        .lean();
      res.status(201).json({ runId: run._id, results });
    } catch (e) {
      await ScreeningRunModel.findByIdAndUpdate(run._id, {
        status: "failed",
        error: e instanceof Error ? e.message : "Unknown error",
      });
      throw e;
    }
  } catch (error) {
    controlDebug("Error in screen route handler");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
const getRuns = async (req: Request, res: Response) => {
  try {
    const jobId = z.string().optional().parse(req.query.jobId);
    const q = jobId ? { jobId } : {};
    const docs = await ScreeningRunModel.find(q)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(docs);
  } catch (error) {
    controlDebug("Error in getting screen runs");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};

const getRunsResult = async (req: Request, res: Response) => {
  try {
    const runId = z.string().min(1).parse(req.params.runId);
    const run = await ScreeningRunModel.findById(runId).lean();
    if (!run) {
      return res.status(404).json({ data_error: "Run not found" });
    }
    const results = await ScreeningResultModel.find({ screeningRunId: runId })
      .sort({ rank: 1 })
      .lean();
    res.json({ run, results });
  } catch (error) {
    controlDebug("Error in getting screen run results");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};

const askGem = async (req: Request, res: Response) => {
  try {
    if (
      !env.GOOGLE_API_KEY ||
      !env.GOOGLE_AI_MODEL ||
      env.VERTEX_PROJECT_ID ||
      env.VERTEX_LOCATION
    ) {
      throw new Error("Could not load environment variables");
    }

    const input = askSchema.parse(req.body);

    const job = input.job_id ? await Job.findById(input.job_id).lean() : null;
    if (input.job_id && !job) {
      return res.status(404).json({ data_error: "Job not found" });
    }

<<<<<<< HEAD




>>>>>>> a0dac98 (Refined the screening ai service)
=======
    const applicants = await Applicant.find(
      input.applicant_ids?.length
        ? { _id: { $in: input.applicant_ids } }
        : input.job_id
          ? { jobId: input.job_id }
          : {},
    )
      .limit(input.max_applicants)
      .lean();
    const ai = await assistantWithGemini({
      model: env.GOOGLE_AI_MODEL,
      question: input.question,
      ...(env.GOOGLE_API_KEY
        ? { provider: "ai-studio" as const, apiKey: env.GOOGLE_API_KEY }
        : {
            provider: "vertex" as const,
            projectId: env.VERTEX_PROJECT_ID!,
            location: env.VERTEX_PROJECT_ID!,
          }),
      job: job
        ? {
            job_id: String(job._id),
            title: job.job_title,
            requirements: job.job_requirements ?? [],
            skills: job.job_skills ?? [],
            experience: job.job_experience ?? undefined,
            education: job.job_qualifications ?? [],
            notes: job.job_notes,
          }
        : undefined,
      candidates: applicants.map((a) => ({
        applicant_id: String(a._id),
        applicant_name: a.applicant_name ?? undefined,
        applicant_email: a.applicant_email ?? undefined,
        location: a.location ?? undefined,
        skills: (a.skills as string[] | undefined) ?? [],
        experience: a.experience ?? undefined,
        education: (a.education as string[] | undefined) ?? [],
        resume_text: a.resume_text ?? undefined,
      })),
    });
    res.json({
      answer: ai.answer,
      suggestedNextQuestions: ai.suggestedNextQuestions,
      context: {
        jobId: input.job_id ?? null,
        applicantCount: applicants.length,
      },
    });
  } catch (error) {
    controlDebug("Error in AI assistant controller");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
>>>>>>> b93dd6c (Added the AI assistant capability)
