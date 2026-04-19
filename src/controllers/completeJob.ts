import Job from "../models/Job.js";
import type { Request, Response } from "express";
import { controlDebug } from "./authControl.js";
interface Criteria {
  criteria_title: string;
  description: string;
  priority: string;
}
interface Desc_Job {
  job_title: string;
  job_department: string;
  job_location: string;
  job_salary_min: number;
  job_salary_max: number;
  job_ai_criteria: Criteria[];
  workers_required: number;
}

const completeJob = async (req: Request, res: Response) => {
  try {
    const { reqBody }: { reqBody: Desc_Job } = req.body;
    if (!reqBody)
      return res.status(400).json({ data_error: "Incorrect job structure" });
    const oldJob = await Job.findOne({ job_title: reqBody.job_title });
    if (oldJob)
      return res.status(401).json({ message: "Job already registered" });
    const job = new Job(reqBody);
    await job.save();
  } catch (error) {
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default completeJob;
