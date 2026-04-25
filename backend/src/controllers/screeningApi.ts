import type { Request, Response } from "express";
import nodemailer from "nodemailer";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import env from "../config/env.js";
import { askRecruiterAssistant } from "../lib/gemini.js";
import { evaluateApplicantsForJob } from "../services/screeningService.js";
import { trimText } from "../utils/talentProfile.js";
import {
  isMongoTransientError,
  withMongoTransientRetry,
} from "../utils/mongoErrors.js";

function latestRunSummary(jobTitle: string, shortlist: Awaited<ReturnType<typeof evaluateApplicantsForJob>>["shortlist"]) {
  const topNames = shortlist.map((item) => item.candidate_id).join(", ");
  return `Screened ${shortlist.length} top candidates for ${jobTitle}. Shortlist ready for recruiter review: ${topNames || "none"}.`;
}

export async function runScreening(req: Request, res: Response) {
  try {
    const jobId = trimText(req.body?.jobId ?? req.body?.job_id);
    const jobTitle = trimText(req.body?.jobTitle ?? req.body?.job_title);
    const job = jobId
      ? await Job.findById(jobId).lean()
      : await Job.findOne({ job_title: jobTitle }).lean();

    if (!job) {
      return res.status(404).json({
        data_error: "Could not find an active job that matches what is specified",
      });
    }

    const applicants = await Applicant.find({
      ...(job._id ? { job_id: job._id } : { job_title: job.job_title }),
    }).lean();

    if (applicants.length === 0) {
      return res.status(404).json({
        data_error: `No active applicants for the job ${job.job_title} yet`,
      });
    }

    const run = await ScreeningRunModel.create({
      job_id: job._id,
      job_title: job.job_title,
      applicant_ids: applicants.map((applicant) => applicant._id),
      topK: Number(job.job_shortlist_size) === 20 ? 20 : 10,
      status: "running",
      model: env.GOOGLE_AI_MODEL || "deterministic+gemini",
      started_at: new Date(),
    });

    const evaluated = await evaluateApplicantsForJob({
      runId: run._id,
      job,
      applicants,
      topK: run.topK,
    });

    await ScreeningResultModel.deleteMany({ screening_run_id: run._id });
    await ScreeningResultModel.insertMany(
      evaluated.results.map((item) => ({
        screening_id: item.screening_id,
        screening_run_id: item.screening_run_id,
        candidate_id: item.candidate_id,
        applicant_id: item.candidate_id,
        job_id: item.job_id,
        evaluated_at: item.evaluated_at,
        overall: item.overall,
        dimension_scores: item.dimension_scores,
        weights_used: item.weights_used,
        flags: item.flags,
        rank: item.rank,
        percentile: item.percentile,
        strengths: item.strengths,
        gaps: item.gaps,
        recommendation: item.recommendation,
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
            applicants.find((applicant) => applicant._id === item.candidate_id)
              ?.applicant_name ?? "Candidate",
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
    console.error("Error in runScreening:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getScreeningRuns(req: Request, res: Response) {
  try {
    const jobId = trimText(req.query.jobId);
    const query = jobId ? { job_id: jobId } : {};
    const runs = await ScreeningRunModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({ runs });
  } catch (error) {
    console.error("Error in getScreeningRuns:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getScreeningRunById(req: Request, res: Response) {
  try {
    const runId = trimText(req.params.runId);
    const [run, results] = await Promise.all([
      ScreeningRunModel.findById(runId).lean(),
      ScreeningResultModel.find({ screening_run_id: runId }).sort({ rank: 1 }).lean(),
    ]);

    if (!run) {
      return res.status(404).json({ data_error: "Run not found" });
    }

    return res.status(200).json({ run, results });
  } catch (error) {
    console.error("Error in getScreeningRunById:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getLatestJobResults(req: Request, res: Response) {
  try {
    const jobId = trimText(req.params.jobId);
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
        data_error: "No screening run found for this job yet",
        hint: "Run POST /ai/run with this job_id first",
        job: {
          id: job._id,
          title: job.job_title,
          state: job.job_state,
        },
      });
    }

    const results = await withMongoTransientRetry(() =>
      ScreeningResultModel.find({
        screening_run_id: latestRun._id,
      })
        .sort({ rank: 1 })
        .lean(),
    );

    return res.status(200).json({
      run: latestRun,
      results,
    });
  } catch (error) {
    console.error("Error in getLatestJobResults:", error);
    if (isMongoTransientError(error)) {
      return res.status(503).json({
        server_error:
          "Database connection is temporarily unavailable. Please retry shortly.",
      });
    }

    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function reviewResult(req: Request, res: Response) {
  try {
    const verdictInput = req.body?.verdict_string;
    const verdicts = Array.isArray(verdictInput)
      ? verdictInput
      : typeof verdictInput === "string"
        ? JSON.parse(verdictInput)
        : [];

    let updatedCount = 0;
    for (const verdict of verdicts) {
      const applicant = verdict?.applicant_id
        ? await Applicant.findById(trimText(verdict.applicant_id))
        : await Applicant.findOne({
            applicant_name: trimText(verdict?.applicant_name),
            job_title: trimText(verdict?.job_title),
          });

      if (!applicant) {
        continue;
      }

      applicant.shortlisted = Boolean(verdict?.shortlisted);
      applicant.applicant_state = verdict?.shortlisted ? "Shortlisted" : "Rejected";
      await applicant.save();
      updatedCount += 1;
    }

    return res.status(200).json({
      success: "Review decisions saved successfully",
      updatedCount,
    });
  } catch (error) {
    console.error("Error in reviewResult:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function sendEmails(req: Request, res: Response) {
  try {
    const jobTitle = trimText(req.body?.job_title);
    if (!jobTitle) {
      return res.status(400).json({ data_error: "No job name provided" });
    }

    const applicants = await Applicant.find({
      shortlisted: true,
      job_title: jobTitle,
    }).lean();

    let sentCount = 0;
    if (env.USER_EMAIL && env.USER_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: env.USER_EMAIL,
          pass: env.USER_PASS,
        },
      });

      for (const applicant of applicants) {
        try {
          await transporter.sendMail({
            from: env.USER_EMAIL,
            to: applicant.applicant_email,
            subject: `Talvo shortlist update for ${jobTitle}`,
            text: `Hello ${applicant.applicant_name}, you have been shortlisted for ${jobTitle}.`,
          });
          sentCount += 1;
        } catch (error) {
          console.error("Error sending shortlist email:", error);
        }
      }
    } else {
      sentCount = applicants.length;
    }

    return res.status(200).json({
      success: "Shortlist emails processed successfully",
      sentCount,
      shortlistedCount: applicants.length,
    });
  } catch (error) {
    console.error("Error in sendEmails:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function askAssistant(req: Request, res: Response) {
  try {
    const jobId = trimText(req.body?.job_id);
    const question = trimText(req.body?.question);
    if (!question) {
      return res.status(400).json({ data_error: "Question is required" });
    }

    const [job, candidates, latestRun] = await Promise.all([
      jobId ? Job.findById(jobId).lean() : null,
      jobId ? Applicant.find({ job_id: jobId }).lean() : Applicant.find().limit(20).lean(),
      jobId
        ? ScreeningRunModel.findOne({ job_id: jobId }).sort({ createdAt: -1 }).lean()
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
    console.error("Error in askAssistant:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}
