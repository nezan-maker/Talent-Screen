import Job from "../models/Job.js";
import askGemini from "../services/aiservice.js";
import type { Request, Response } from "express";
import { controlDebug } from "./authControl.js";
import env from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
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
  job_description: Criteria[];
  job_responsibilities: string;
  job_qualifications: string;
  workers_required: number;
}

const completeJob = async (req: Request, res: Response) => {
  try {
    const { reqBody }: { reqBody: Desc_Job } = req.body;
    const access_token = req.cookies.reference_token;
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

    const job = new Job(reqBody);
    let guidelines: string =
      "You are to create  an example resume that addresses all the job details that will be presented to the user as a reference to ensure all needed info are given.P.S the values of main properties must be in capital letters and the response you give me back must be a json stringified string I will pass into an object that I will store in the database";
    let prompt_object = { job, guidelines };
    let prompt = JSON.stringify(prompt_object);
    let result = await askGemini(prompt);
    if (result.startsWith("```json")) {
      result = result.replace("/```json|```/g", "");
    }
    job.job_example_form = result;
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
