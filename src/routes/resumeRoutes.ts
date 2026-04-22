import express from "express";
import resumeParse from "../controllers/parseResumes.js";
import resumeUpload from "../controllers/resumeUpload.js";
import type { Request, Response } from "express";
const resumeRoutes = () => {
  const router = express.Router();
  router.post("/resume", resumeUpload, resumeParse);
};
