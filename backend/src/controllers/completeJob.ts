import Job from "../models/Job.js";
import type { Request, Response } from "express";
import { controlDebug } from "./authControl.js";
import env from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JobSchema, type Job_ } from "../validations/functionValidations.js";

interface Desc_Job {
  job_title: string;
  job_department: string;
  job_location: string;
  job_employment_type: string;
  job_requirements: string;
  job_skills: string[];
  job_qualifications: string;
  workers_required: number;
  job_notes: string[];
}

const completeJob = async (req: Request, res: Response) => {
  try {
    const { reqString } = req.body;
    const reqBody: Desc_Job = JSON.parse(reqString);
    const z_parse_result: Job_ = JobSchema.parse(reqBody);
    const access_token = req.cookies.access_token;
    if (!access_token) {
      throw new Error("Could not find user_details cookie missing or expired");
    }
    if (!env.ACCESS_SECRET) {
      throw new Error("Access token environment variable could not be found");
    }
    if (!reqBody)
      return res.status(400).json({ data_error: "Incorrect job structure" });
    const oldJob = await Job.findOne({ job_title: reqBody.job_title });
    if (oldJob)
      return res.status(401).json({ message: "Job already registered" });
    let payload = jwt.verify(access_token, env.ACCESS_SECRET) as jwt.JwtPayload;
    let user_id: string = payload.userId;
    if (!user_id) {
      throw new Error("Could not find user details");
    }
    const user = await User.findOne({ _id: user_id });
    if (!user) {
      throw new Error("Could not find user details");
    }
    let company_name = user.company_name;

    const job = new Job(z_parse_result);
    job.company_name = company_name;
    await job.save();
    res.status(201).json({ success: "Job successfully created" });
  } catch (error) {
    controlDebug("Error in complete job controller");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default completeJob;
