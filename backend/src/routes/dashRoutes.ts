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

// const upload = multer({ storage: multer.memoryStorage() });
const storage = multer.memoryStorage();
export let fieldnames = ["applicants_spreadsheet", "resume_pdf_zip"];
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/csv",
  ];
  if (
    ((file.mimetype === allowedMimes[0] || file.mimetype === allowedMimes[2]) &&
      file.fieldname === fieldnames[0]) ||
    (file.mimetype === allowedMimes[1] && file.fieldname === fieldnames[1])
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "File type not supported only ZIP,XLSX and CSV file formats allowed respectively",
      ),
    );
  }
};
const upload = multer({ storage: storage, fileFilter });
let fields = upload.fields([
  { name: "applicants_spreadsheet", maxCount: 1 },
  { name: "resume_pdf_zip", maxCount: 1 },
]);

const dashRoutes = () => {
  const router = express.Router();

  router.get("/dashboard", middleAuth, getDashboardOverview);
  router.get("/jobs", middleAuth, getJobs);
  router.get("/jobs/:id", middleAuth, getJobById);
  router.get("/candidates", middleAuth, getCandidates);
  router.get("/candidates/:id", middleAuth, getCandidateById);

  router.post("/complete-job", middleAuth, createJob);
  router.post("/register-candidates", middleAuth, fields, registerCandidates);
  router.post("/ask", middleAuth, runScreening);
  router.post("/review-result", middleAuth, reviewResult);
  router.post("/sendEmails", middleAuth, sendEmails);

  return router;
};

export default dashRoutes;
