import express from "express";
import dashBoardControl from "../controllers/dashboardControl.js";
import applicantControl from "../controllers/applicantControl.js";
import askGeminiCont from "../controllers/askGeminiControl.js";
import completeJob from "../controllers/completeJob.js";
import multer from "multer";
import type { Request, Response } from "express";
const storage = multer.memoryStorage();
export let fieldnames = ["applicant_spreadsheet", "resume_pdf_zip"];
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
  ];
  if (
    (file.mimetype === allowedMimes[0] && file.fieldname === fieldnames[0]) ||
    (file.mimetype === allowedMimes[1] && file.fieldname === fieldnames[1])
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "File type not supported only ZIP and PDF formats allowed respectively",
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
  router.get("/dashboard", dashBoardControl);
  router.post("/register-candidate", fields, applicantControl);
  router.post("/ask", askGeminiCont);
  router.post("/complete-job", completeJob);
  return router;
};
export default dashRoutes;
