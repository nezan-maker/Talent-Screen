import type { Request, Response } from "express";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import {
  buildDashboardStats,
  mapApplicantToFrontend,
  mapJobToFrontend,
} from "../utils/frontendMappers.js";

export async function getDashboardOverview(_req: Request, res: Response) {
  try {
    const [jobs, applicants] = await Promise.all([
      Job.find().sort({ updatedAt: -1, createdAt: -1 }).lean(),
      Applicant.find().sort({ updatedAt: -1, createdAt: -1 }).lean(),
    ]);

    const mappedApplicants = applicants.map(mapApplicantToFrontend);
    const mappedJobs = jobs.map((job) => mapJobToFrontend(job, mappedApplicants));

    return res.status(200).json({
      applicants: mappedApplicants,
      jobs: mappedJobs,
      stats: buildDashboardStats(mappedJobs, mappedApplicants),
    });
  } catch (error) {
    console.error("Error in getDashboardOverview:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}
