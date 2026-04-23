import express from "express";
import { middleAuth } from "../middlewares/authMiddleware.js";
import {
  createJob,
  getCandidate,
  getCandidates,
  getDashboardOverview,
  getJob,
  getJobs,
  registerCandidates,
  reviewResult,
  runScreening,
  sendEmails,
  upload,
  uploadResumeZip,
} from "../controllers/clientApiControl.js";

export const fieldnames = ["applicants_spreadsheet", "resume_pdf_zip"];

const dashRoutes = () => {
  const router = express.Router();

  router.get("/dashboard", middleAuth, getDashboardOverview);
  router.get("/jobs", middleAuth, getJobs);
  router.get("/jobs/:id", middleAuth, getJob);
  router.get("/candidates", middleAuth, getCandidates);
  router.get("/candidates/:id", middleAuth, getCandidate);
  router.post("/register-candidate", middleAuth, registerCandidates);
  router.post(
    "/register-candidates",
    middleAuth,
    upload.single("file"),
    registerCandidates,
  );
  router.post("/resume", middleAuth, upload.single("file"), uploadResumeZip);
  router.post("/ask", middleAuth, runScreening);
  router.post("/complete-job", middleAuth, createJob);
  router.post("/review-result", middleAuth, reviewResult);
  router.post("/sendEmails", middleAuth, sendEmails);

  return router;
};

export default dashRoutes;
