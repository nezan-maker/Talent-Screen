import express from "express";
import multer from "multer";
import { middleAuth } from "../middlewares/authMiddleware.js";
import { getDashboardOverview } from "../controllers/dashboardApi.js";
import { getCandidateById, getCandidates } from "../controllers/candidateApi.js";
import { createJob, getJobById, getJobs } from "../controllers/jobApi.js";
import { registerCandidates, uploadResumeZip } from "../controllers/intakeApi.js";
import { reviewResult, runScreening, sendEmails, } from "../controllers/screeningApi.js";
const upload = multer({ storage: multer.memoryStorage() });
const dashRoutes = () => {
    const router = express.Router();
    router.get("/dashboard", middleAuth, getDashboardOverview);
    router.get("/jobs", middleAuth, getJobs);
    router.get("/jobs/:id", middleAuth, getJobById);
    router.get("/candidates", middleAuth, getCandidates);
    router.get("/candidates/:id", middleAuth, getCandidateById);
    router.post("/complete-job", middleAuth, createJob);
    router.post("/register-candidates", middleAuth, upload.single("file"), registerCandidates);
    router.post("/resume", middleAuth, upload.single("file"), uploadResumeZip);
    router.post("/ask", middleAuth, runScreening);
    router.post("/review-result", middleAuth, reviewResult);
    router.post("/sendEmails", middleAuth, sendEmails);
    return router;
};
export default dashRoutes;
//# sourceMappingURL=dashRoutes.js.map