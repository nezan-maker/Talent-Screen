
import type { Request, Response, NextFunction } from "express";
import { controlDebug } from "./authControl.js";
import unzipper from "unzipper";
import env from "../config/env.js";
import Resume from "../models/Resume.js";
import Applicant from "../models/Applicant.js";
import mongoose from "mongoose";
export interface ExtendedRequest extends Request {
  resume_array: mongoose.Types.ObjectId[];
}
const resumeUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data_error: "No valid PDF file uploaded" });
    }
    
  } catch (error) {
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default resumeUpload;
