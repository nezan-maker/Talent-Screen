import type { Request, Response } from "express";
import Applicant from "../models/Applicant.js";
import { mapApplicantToFrontend } from "../utils/frontendMappers.js";
import { resolveOwnedApplicants, resolveOwnedJobs } from "../utils/ownership.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { trimText } from "../utils/talentProfile.js";

export async function getCandidates(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, limit } = parsePagination(req.query);
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }
    const ownedJobs = await resolveOwnedJobs({
      userId,
      currentUser: req.currentUser,
    });
    const allApplicants = await resolveOwnedApplicants({
      userId,
      ownedJobs,
    });
    const totalCandidates = allApplicants.length;
    const applicants = allApplicants.slice(skip, skip + limit);

    return res.status(200).json({
      candidates: applicants.map(mapApplicantToFrontend),
      pagination: buildPaginationMeta(totalCandidates, page, pageSize),
    });
  } catch (error) {
    console.error("Error in getCandidates:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getCandidateById(req: Request, res: Response) {
  try {
    const id = trimText(req.params.id);
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }
    const ownedJobs = await resolveOwnedJobs({
      userId,
      currentUser: req.currentUser,
    });
    const applicants = await resolveOwnedApplicants({
      userId,
      ownedJobs,
    });
    const applicant =
      applicants.find((item) => trimText(item._id) === id) ?? null;
    if (!applicant) {
      return res.status(404).json({ data_error: "Candidate not found" });
    }

    return res.status(200).json({
      candidate: mapApplicantToFrontend(applicant),
    });
  } catch (error) {
    console.error("Error in getCandidateById:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}
