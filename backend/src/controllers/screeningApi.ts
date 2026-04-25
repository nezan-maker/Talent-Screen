import type { Request, Response } from "express";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import env from "../config/env.js";
import { askRecruiterAssistant } from "../lib/gemini.js";
import {
  buildRejectedApplicantEmail,
  buildShortlistedApplicantEmail,
} from "../lib/emailTemplates.js";
import { sendMailIfConfigured } from "../lib/mailer.js";
import { evaluateApplicantsForJob } from "../services/screeningService.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { trimText } from "../utils/talentProfile.js";
import {
  isMongoTransientError,
  withMongoTransientRetry,
} from "../utils/mongoErrors.js";





function buildApplicantJobQuery(job: { _id?: string; job_title?: string }) {
  const jobId = trimText(job?._id);
  const jobTitle = trimText(job?.job_title);

  const filters = [
    ...(jobId ? [{ job_id: jobId }] : []),
    ...(jobTitle ? [{ job_title: jobTitle }] : []),
  ];

  if (filters.length === 0) return {};
  if (filters.length === 1) return filters[0];
  return { $or: filters };
}

async function hydrateApplicantsWithResumeText(job: any, applicants: any[]) {
  const missingIds = applicants
    .filter((a) => !trimText(a?.resume_text))
    .map((a) => trimText(a?._id))
    .filter(Boolean);

  if (missingIds.length === 0) return applicants;

  const resumes = await Resume.find({
    applicant_id: { $in: missingIds },
    ...buildApplicantJobQuery(job),
  })
    .select({ applicant_id: 1, parsed_text: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();

  const map = new Map<string, string>();

  for (const r of resumes) {
    const id = trimText((r as any)?.applicant_id);
    const text = trimText((r as any)?.parsed_text);
    if (!id || !text || map.has(id)) continue;
    map.set(id, text);
  }

  if (map.size === 0) return applicants;

  await Promise.all(
    Array.from(map.entries()).map(([id, text]) =>
      Applicant.findByIdAndUpdate(id, { resume_text: text }),
    ),
  );

  return applicants.map((a) => {
    const id = trimText(a?._id);
    if (!id || trimText(a?.resume_text)) return a;
    const text = map.get(id);
    return text ? { ...a, resume_text: text } : a;
  });
}





export async function runScreening(req: Request, res: Response) {
  let runId = "";

  try {
    const jobId = trimText(req.body?.jobId ?? req.body?.job_id);
    const jobTitle = trimText(req.body?.jobTitle ?? req.body?.job_title);

    const job = jobId
      ? await Job.findById(jobId).lean()
      : await Job.findOne({ job_title: jobTitle }).lean();

    if (!job) {
      return res.status(404).json({
        data_error: "Job not found",
      });
    }

    const applicants = await Applicant.find(buildApplicantJobQuery(job)).lean();

    if (applicants.length === 0) {
      return res.status(404).json({
        data_error: `No applicants for ${job.job_title}`,
      });
    }

    const hydrated = await hydrateApplicantsWithResumeText(job, applicants);

    const run = await ScreeningRunModel.create({
      job_id: job._id,
      job_title: job.job_title,
      applicant_ids: hydrated.map((a) => a._id),
      topK: Number(job.job_shortlist_size) === 20 ? 20 : 10,
      status: "running",
      model: env.GOOGLE_AI_MODEL || "deterministic+gemini",
      started_at: new Date(),
    });

    runId = trimText(run._id);

    const evaluated = await evaluateApplicantsForJob({
      runId: run._id,
      job,
      applicants: hydrated,
      topK: run.topK,
    });

    

    await ScreeningResultModel.deleteMany({ screening_run_id: run._id });

    await ScreeningResultModel.insertMany(
      evaluated.results.map((r) => ({
        screening_id: r.screening_id,
        screening_run_id: r.screening_run_id,
        candidate_id: r.candidate_id,
        applicant_id: r.candidate_id,
        job_id: r.job_id,
        evaluated_at: r.evaluated_at,
        overall: r.overall,
        dimension_scores: r.dimension_scores,
        weights_used: r.weights_used,
        flags: r.flags,
        rank: r.rank,
        percentile: r.percentile,
        strengths: r.strengths,
        gaps: r.gaps,
        recommendation: r.recommendation,
      })),
    );

    await ScreeningRunModel.findByIdAndUpdate(run._id, {
      status: "completed",
      completed_at: new Date(),
      result_count: evaluated.results.length,
    });

    await Job.findByIdAndUpdate(job._id, { job_state: "Complete" });

    return res.status(200).json({
      success: {
        job_title: job.job_title,
        applicants_details: evaluated.shortlist.map((item) => ({
          applicant_id: item.candidate_id,
          applicant_name:
            hydrated.find((a) => a._id === item.candidate_id)?.applicant_name ||
            "Candidate",
          applicant_marks: item.overall.score,
          applicant_specification_relevance: {
            skills_relevance: item.dimension_scores.skills_match.score,
            education_relevance: item.dimension_scores.education_fit.score,
          },
          applicant_result_description: item.overall.summary,
        })),
        result_verdict: evaluated.resultVerdict,
      },
    });
  } catch (error) {
    if (runId) {
      await ScreeningRunModel.findByIdAndUpdate(runId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    console.error("runScreening error:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}





export async function askAssistant(req: Request, res: Response) {
  try {
    const jobId = trimText(req.body?.job_id);
    const question = trimText(req.body?.question);

    if (!question) {
      return res.status(400).json({ data_error: "Question required" });
    }

    const [job, candidates, latestRun] = await Promise.all([
      jobId ? Job.findById(jobId).lean() : null,
      jobId
        ? Applicant.find({ job_id: jobId }).lean()
        : Applicant.find().limit(20).lean(),
      jobId
        ? ScreeningRunModel.findOne({ job_id: jobId })
            .sort({ createdAt: -1 })
            .lean()
        : null,
    ]);

    const results = latestRun
      ? await ScreeningResultModel.find({ screening_run_id: latestRun._id })
          .sort({ rank: 1 })
          .limit(20)
          .lean()
      : [];

    const answer = await askRecruiterAssistant({
      question,
      job,
      candidates,
      results,
    });

    return res.status(200).json({
      ...answer,
      context: {
        jobId: jobId || null,
        applicantCount: candidates.length,
      },
    });
  } catch (error) {
    console.error("askAssistant error:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}





export async function getScreeningRuns(req: Request, res: Response) {
  try {
    const jobId = trimText(req.query.jobId);
    const query = jobId ? { job_id: jobId } : {};

    const { page, pageSize, skip, limit } = parsePagination(req.query);

    const [total, runs] = await Promise.all([
      ScreeningRunModel.countDocuments(query),
      ScreeningRunModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      runs,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("getScreeningRuns error:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getScreeningRunById(req: Request, res: Response) {
  try {
    const runId = trimText(req.params.runId);
    const { page, pageSize, skip, limit } = parsePagination(req.query);

    const run = await ScreeningRunModel.findById(runId).lean();

    if (!run) {
      return res.status(404).json({ data_error: "Run not found" });
    }

    const [total, results] = await Promise.all([
      ScreeningResultModel.countDocuments({ screening_run_id: runId }),
      ScreeningResultModel.find({ screening_run_id: runId })
        .sort({ rank: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      run,
      results,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("getScreeningRunById error:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getLatestJobResults(req: Request, res: Response) {
  try {
    const jobId = trimText(req.params.jobId);
    const { page, pageSize, skip, limit } = parsePagination(req.query);

    const job = await withMongoTransientRetry(() =>
      Job.findById(jobId)
        .select({ _id: 1, job_title: 1, job_state: 1 })
        .lean(),
    );

    if (!job) {
      return res.status(404).json({ data_error: "Job not found" });
    }

    const latestRun = await withMongoTransientRetry(() =>
      ScreeningRunModel.findOne({ job_id: jobId })
        .sort({ createdAt: -1 })
        .lean(),
    );

    if (!latestRun) {
      return res.status(404).json({
        data_error: "No screening run yet",
        hint: "Run POST /ai/run first",
      });
    }

    const [total, results] = await Promise.all([
      withMongoTransientRetry(() =>
        ScreeningResultModel.countDocuments({
          screening_run_id: latestRun._id,
        }),
      ),
      withMongoTransientRetry(() =>
        ScreeningResultModel.find({
          screening_run_id: latestRun._id,
        })
          .sort({ rank: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ),
    ]);

    return res.status(200).json({
      run: latestRun,
      results,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (error) {
    console.error("getLatestJobResults error:", error);

    if (isMongoTransientError(error)) {
      return res.status(503).json({
        server_error: "Database temporarily unavailable",
      });
    }

    return res.status(500).json({ server_error: "Internal server error" });
  }
}





export async function reviewResult(req: Request, res: Response) {
  try {
    const raw = req.body?.verdict_string;

    const verdicts = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
      ? JSON.parse(raw)
      : [];

    let updated = 0;

    for (const v of verdicts) {
      const applicant = v?.applicant_id
        ? await Applicant.findById(trimText(v.applicant_id))
        : await Applicant.findOne({
            applicant_name: trimText(v?.applicant_name),
            job_title: trimText(v?.job_title),
          });

      if (!applicant) continue;

      applicant.shortlisted = Boolean(v?.shortlisted);
      applicant.applicant_state = v?.shortlisted
        ? "Shortlisted"
        : "Rejected";

      await applicant.save();
      updated++;
    }

    return res.status(200).json({
      success: "Review saved",
      updatedCount: updated,
    });
  } catch (error) {
    console.error("reviewResult error:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function sendEmails(req: Request, res: Response) {
  try {
    const jobTitle = trimText(req.body?.job_title);

    if (!jobTitle) {
      return res.status(400).json({ data_error: "Job title required" });
    }

    const applicants = await Applicant.find({ job_title: jobTitle }).lean();

    const shortlisted = applicants.filter(
      (a) => a.shortlisted || trimText(a.applicant_state).toLowerCase() === "shortlisted",
    );

    const rejected = applicants.filter(
      (a) => trimText(a.applicant_state).toLowerCase() === "rejected",
    );

    let sentShortlisted = 0;
    let sentRejected = 0;

    for (const a of shortlisted) {
      const email = trimText(a.applicant_email || a.email);
      if (!email) continue;

      const mail = buildShortlistedApplicantEmail({
        applicantName: trimText(a.applicant_name) || "Applicant",
        jobTitle,
      });

      if (
        await sendMailIfConfigured({
          to: email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        })
      ) {
        sentShortlisted++;
      }
    }

    for (const a of rejected) {
      const email = trimText(a.applicant_email || a.email);
      if (!email) continue;

      const mail = buildRejectedApplicantEmail({
        applicantName: trimText(a.applicant_name) || "Applicant",
        jobTitle,
      });

      if (
        await sendMailIfConfigured({
          to: email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        })
      ) {
        sentRejected++;
      }
    }

    return res.status(200).json({
      success: "Emails processed",
      sentCount: sentShortlisted + sentRejected,
    });
  } catch (error) {
    console.error("sendEmails error:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}
