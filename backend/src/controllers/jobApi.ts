import type { Request, Response } from "express";
import Job from "../models/Job.js";
import Applicant from "../models/Applicant.js";
import {
  mapApplicantToFrontend,
  mapJobToFrontend,
} from "../utils/frontendMappers.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { parseJobCriteria, trimText } from "../utils/talentProfile.js";

function buildExampleForm(payload: {
  job_title: string;
  job_experience_required: string;
  job_ai_criteria: unknown;
}) {
  const criteria = parseJobCriteria(payload.job_ai_criteria);
  return {
    ROLE_TITLE: payload.job_title,
    EXPERIENCE_LEVEL: payload.job_experience_required,
    CORE_STRENGTHS: criteria
      .map((item) => item.criteria_string)
      .filter(Boolean),
  };
}

function extractPayload(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "reqBody" in body &&
    body.reqBody &&
    typeof body.reqBody === "object"
  ) {
    return body.reqBody as Record<string, unknown>;
  }

  return (body ?? {}) as Record<string, unknown>;
}

export async function getJobs(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, limit } = parsePagination(req.query);
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }
    const filter = { user_id: userId };
    const [totalJobs, jobs, applicants] = await Promise.all([
      Job.countDocuments(filter),
      Job.find({ user_id: userId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Applicant.find({ user_id: req.currentUserId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
    ]);
    const mappedApplicants = applicants.map(mapApplicantToFrontend);

    return res.status(200).json({
      jobs: jobs.map((job) => mapJobToFrontend(job, mappedApplicants)),
      pagination: buildPaginationMeta(totalJobs, page, pageSize),
    });
  } catch (error) {
    console.error("Error in getJobs:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getJobById(req: Request, res: Response) {
  try {
    const id = trimText(req.params.id);
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }
    const [job, applicants] = await Promise.all([
      Job.findOne({ _id: id, user_id: userId }).lean(),
      Applicant.find({ user_id: req.currentUserId }).lean(),
    ]);

    if (!job) {
      return res.status(404).json({ data_error: "Job not found" });
    }

    const mappedApplicants = applicants.map(mapApplicantToFrontend);
    return res.status(200).json({
      job: mapJobToFrontend(job, mappedApplicants),
    });
  } catch (error) {
    console.error("Error in getJobById:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function createJob(req: Request, res: Response) {
  try {
    const payload = extractPayload(req.body);
    const job_title = trimText(payload.job_title);
    const job_department = trimText(payload.job_department);
    const job_location = trimText(payload.job_location);
    const job_employment_type = trimText(payload.job_employment_type);
    const job_description = trimText(payload.job_description);
    const user_Id = req.currentUserId;
    if (!user_Id) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }
    const user_id = user_Id;

    if (
      !job_title ||
      !job_department ||
      !job_location ||
      !job_employment_type ||
      !job_description
    ) {
      return res
        .status(400)
        .json({ data_error: "Missing required job fields" });
    }

    const oldJob = await Job.findOne({ job_title }).lean();
    if (oldJob) {
      return res.status(409).json({ message: "Job already registered" });
    }

    const job = await Job.create({
      user_id,
      job_title,
      job_department,
      job_location,
      job_employment_type,
      company_name: req.currentUser?.company_name ?? "Independent Recruiter",
      job_experience_required:
        trimText(payload.job_experience_required) || "Mid",
      job_description,
      job_responsibilities: trimText(payload.job_responsibilities),
      job_qualifications: trimText(payload.job_qualifications),
      job_ai_criteria: parseJobCriteria(payload.job_ai_criteria),
      job_shortlist_size: Number(payload.job_shortlist_size) === 20 ? 20 : 10,
      job_state: trimText(payload.job_state) || "Active",
      job_salary_min:
        typeof payload.job_salary_min === "number"
          ? payload.job_salary_min
          : null,
      job_salary_max:
        typeof payload.job_salary_max === "number"
          ? payload.job_salary_max
          : null,
      workers_required:
        typeof payload.workers_required === "number"
          ? payload.workers_required
          : 1,
      job_example_form: buildExampleForm({
        job_title,
        job_experience_required:
          trimText(payload.job_experience_required) || "Mid",
        job_ai_criteria: payload.job_ai_criteria,
      }),
    });

    const mappedApplicants = (await Applicant.find().lean()).map(
      mapApplicantToFrontend,
    );
    return res.status(201).json({
      success: "Job successfully created",
      job: mapJobToFrontend(job.toObject(), mappedApplicants),
    });
  } catch (error) {
    console.error("Error in createJob:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}
