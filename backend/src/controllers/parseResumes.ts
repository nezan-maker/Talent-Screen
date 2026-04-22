import * as pdfLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Request, Response } from "express";
import Resume from "../models/Resume.js";
import Applicant from "../models/Applicant.js";
import { controlDebug } from "./authControl.js";
import axios from "axios";

const resumeParse = async (req: Request, res: Response) => {
  try {
    const resume_array = req.resume_array;
    if (!resume_array) {
      return res.status(500).json({ srver_error: "Internal server error" });
    }

  } catch (error) {
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default resumeParse;
