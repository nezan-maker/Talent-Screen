import express from "express";
import multer from "multer";
import { middleAuth } from "../middlewares/authMiddleware.js";
import { getDashboardOverview } from "../controllers/dashboardApi.js";
import {
  getCandidateById,
  getCandidates,
} from "../controllers/candidateApi.js";
import { createJob, getJobById, getJobs } from "../controllers/jobApi.js";
import {
  registerCandidates,
  uploadResumeZip,
} from "../controllers/intakeApi.js";
import {
  reviewResult,
  runScreening,
  sendEmails,
} from "../controllers/screeningApi.js";

const storage = multer.memoryStorage();
const spreadsheetMimes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-excel",
]);
const zipMimes = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "multipart/x-zip",
]);
const spreadsheetFields = new Set(["file", "applicants_spreadsheet"]);
const resumeZipFields = new Set(["file", "resume_pdf_zip"]);

const spreadsheetUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!spreadsheetFields.has(file.fieldname)) {
      cb(new Error("Unexpected file field for applicant spreadsheet upload."));
      return;
    }

    const isCsv = file.originalname.toLowerCase().endsWith(".csv");
    if (spreadsheetMimes.has(file.mimetype) || isCsv) {
      cb(null, true);
      return;
    }

    cb(
      new Error("File type not supported. Only CSV and XLSX are allowed."),
    );
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "applicants_spreadsheet", maxCount: 1 },
]);

const resumeZipUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!resumeZipFields.has(file.fieldname)) {
      cb(new Error("Unexpected file field for resume ZIP upload."));
      return;
    }

    const isZip = file.originalname.toLowerCase().endsWith(".zip");
    if (zipMimes.has(file.mimetype) || isZip) {
      cb(null, true);
      return;
    }

    cb(new Error("File type not supported. Only ZIP is allowed."));
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "resume_pdf_zip", maxCount: 1 },
]);

const uploadErrorHandler: express.ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ data_error: error.message });
  }

  if (error instanceof Error) {
    return res.status(400).json({ data_error: error.message });
  }

  return next(error);
};

const dashRoutes = () => {
  const router = express.Router();

  router.get("/dashboard", middleAuth, getDashboardOverview);
  router.get("/jobs", middleAuth, getJobs);
  router.get("/jobs/:id", middleAuth, getJobById);
  router.get("/candidates", middleAuth, getCandidates);
  router.get("/candidates/:id", middleAuth, getCandidateById);

  router.post("/complete-job", middleAuth, createJob);
  router.post(
    "/register-candidates",
    middleAuth,
    spreadsheetUpload,
    registerCandidates,
    uploadErrorHandler,
  );
  router.post(
    "/resume",
    middleAuth,
    resumeZipUpload,
    uploadResumeZip,
    uploadErrorHandler,
  );
  router.post("/ask", middleAuth, runScreening);
  router.post("/review-result", middleAuth, reviewResult);
  router.post("/sendEmails", middleAuth, sendEmails);

  return router;
};

export default dashRoutes;
