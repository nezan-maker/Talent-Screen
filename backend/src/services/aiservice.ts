import { Router, type Request, type Response } from "express";
import Job from "../models/Job.js";
import Applicant from "../models/Applicant.js";
import env from "../config/env.js";
import { middleAuth } from "../middlewares/authMiddleware.js";
import assistantRouter from "../routes/assistant.js";
import screeningRouter from "../routes/screening.js";
import {
  askAssistant,
  getLatestJobResults,
  getScreeningRunById,
  getScreeningRuns,
  runScreening,
} from "../controllers/screeningApi.js";

const router = Router();

router.use(middleAuth);

const geminiRouteOptions = {
  geminiModel: env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
  ...(env.GOOGLE_API_KEY ? { aiStudioApiKey: env.GOOGLE_API_KEY } : {}),
  ...(env.VERTEX_PROJECT_ID ? { vertexProjectId: env.VERTEX_PROJECT_ID } : {}),
  ...(env.VERTEX_LOCATION ? { vertexLocation: env.VERTEX_LOCATION } : {}),
};

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
router.use("/assistant", assistantRouter(geminiRouteOptions));
router.use("/screening", screeningRouter(geminiRouteOptions));
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
