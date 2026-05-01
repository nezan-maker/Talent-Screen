import type { Request, Response } from "express";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import env from "../config/env.js";
import {
  askRecruiterAssistant,
  resolveGeminiAuth,
  reviewApplicantWithGemini,
} from "../lib/gemini.js";
import {
  buildRejectedApplicantEmail,
  buildShortlistedApplicantEmail,
} from "../lib/emailTemplates.js";
import { emailDeliveryConfigured, sendMailIfConfigured } from "../lib/mailer.js";
import { evaluateApplicantsForJob } from "../services/screeningService.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { trimText } from "../utils/talentProfile.js";
import {
  isMongoTransientError,
  withMongoTransientRetry,
} from "../utils/mongoErrors.js";

function latestRunSummary(jobTitle: string, shortlist: Awaited<ReturnType<typeof evaluateApplicantsForJob>>["shortlist"]) {
  const topNames = shortlist.map((item) => item.candidate_id).join(", ");
  return `Screened ${shortlist.length} top candidates for ${jobTitle}. Shortlist ready for recruiter review: ${topNames || "none"}.`;
}

function buildApplicantJobQuery(job: {
  _id?: string | undefined;
  job_title?: string | undefined;
}) {
  const jobId = trimText(job?._id);
  const jobTitle = trimText(job?.job_title);
  const scopedFilters = [
    ...(jobId ? [{ job_id: jobId }] : []),
    ...(jobTitle ? [{ job_title: jobTitle }] : []),
  ];

  if (scopedFilters.length === 0) {
    return {};
  }

  if (scopedFilters.length === 1) {
    return scopedFilters[0];
  }

  return { $or: scopedFilters };
}

async function resolveJobForOutcomeEmails(input: {
  userId?: string;
  jobId?: string;
  jobTitle?: string;
}) {
  const userId = trimText(input.userId);
  const jobId = trimText(input.jobId);
  const jobTitle = trimText(input.jobTitle);

  if (!userId) {
    return null;
  }

  if (jobId) {
    return Job.findOne({ _id: jobId, user_id: userId }).lean();
  }

  if (jobTitle) {
    return Job.findOne({ job_title: jobTitle, user_id: userId }).lean();
  }

  return null;
}

async function processOutcomeEmailsForJob(input: {
  userId: string;
  job: { _id?: string | undefined; job_title?: string | undefined };
}) {
  const userId = trimText(input.userId);
  const jobTitle = trimText(input.job.job_title) || "the role";
  const applicantScope = buildApplicantJobQuery({
    _id: input.job._id,
    job_title: input.job.job_title,
  });

  const applicants = await Applicant.find({
    ...applicantScope,
    user_id: userId,
  }).lean();

  const shortlistedApplicants = applicants.filter((applicant) => {
    const state = trimText(applicant.applicant_state).toLowerCase();
    return Boolean(applicant.shortlisted) || state === "shortlisted";
  });
  const rejectedApplicants = applicants.filter((applicant) => {
    const state = trimText(applicant.applicant_state).toLowerCase();
    return state === "rejected";
  });

  let shortlistedSentCount = 0;
  let rejectedSentCount = 0;

  const shortlistedResults = await Promise.all(
    shortlistedApplicants.map(async (applicant) => {
      const recipient = trimText(applicant.applicant_email || applicant.email);
      if (!recipient) {
        return false;
      }

      const mail = buildShortlistedApplicantEmail({
        applicantName: trimText(applicant.applicant_name) || "Applicant",
        jobTitle,
      });
      return sendMailIfConfigured({
        to: recipient,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    }),
  );

  const rejectedResults = await Promise.all(
    rejectedApplicants.map(async (applicant) => {
      const recipient = trimText(applicant.applicant_email || applicant.email);
      if (!recipient) {
        return false;
      }

      const mail = buildRejectedApplicantEmail({
        applicantName: trimText(applicant.applicant_name) || "Applicant",
        jobTitle,
      });
      return sendMailIfConfigured({
        to: recipient,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    }),
  );

  shortlistedSentCount = shortlistedResults.filter(Boolean).length;
  rejectedSentCount = rejectedResults.filter(Boolean).length;

  const mailerConfigured = emailDeliveryConfigured();
  return {
    sentCount: shortlistedSentCount + rejectedSentCount,
    shortlistedCount: shortlistedApplicants.length,
    rejectedCount: rejectedApplicants.length,
    shortlistedSentCount,
    rejectedSentCount,
    emailDeliveryConfigured: mailerConfigured,
    pendingEmailCount: mailerConfigured
      ? shortlistedApplicants.length +
          rejectedApplicants.length -
          shortlistedSentCount -
          rejectedSentCount
      : shortlistedApplicants.length + rejectedApplicants.length,
  };
}

async function hydrateApplicantsWithResumeText(job: any, applicants: any[]) {
  const applicantsMissingResumeText = applicants
    .filter((item) => !trimText(item?.resume_text))
    .map((item) => trimText(item?._id))
    .filter(Boolean);

  if (applicantsMissingResumeText.length === 0) {
    return applicants;
  }

  const resumeScope = buildApplicantJobQuery(job);
  const resumeFilters = {
    applicant_id: { $in: applicantsMissingResumeText },
    ...resumeScope,
  };
  const resumes = await Resume.find(resumeFilters)
    .select({ applicant_id: 1, parsed_text: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();

  if (resumes.length === 0) {
    return applicants;
  }

  const resumeTextByApplicantId = new Map<string, string>();
  for (const resume of resumes) {
    const applicantId = trimText((resume as any)?.applicant_id);
    const parsedText = trimText((resume as any)?.parsed_text);
    if (!applicantId || !parsedText || resumeTextByApplicantId.has(applicantId)) {
      continue;
    }

    resumeTextByApplicantId.set(applicantId, parsedText);
  }

  if (resumeTextByApplicantId.size === 0) {
    return applicants;
  }

  await Promise.all(
    Array.from(resumeTextByApplicantId.entries()).map(([applicantId, resumeText]) =>
      Applicant.findByIdAndUpdate(applicantId, { resume_text: resumeText }),
    ),
  );

  return applicants.map((applicant) => {
    const applicantId = trimText(applicant?._id);
    if (!applicantId || trimText(applicant?.resume_text)) {
      return applicant;
    }

    const resumeText = resumeTextByApplicantId.get(applicantId);
    if (!resumeText) {
      return applicant;
    }

    return {
      ...applicant,
      resume_text: resumeText,
    };
  });
}

export async function runScreening(req: Request, res: Response) {
  let runId = "";
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const jobId = trimText(req.body?.jobId ?? req.body?.job_id);
    const jobTitle = trimText(req.body?.jobTitle ?? req.body?.job_title);
    const job = jobId
      ? await Job.findOne({ _id: jobId, user_id: userId }).lean()
      : await Job.findOne({ job_title: jobTitle, user_id: userId }).lean();

    if (!job) {
      return res.status(404).json({
        data_error: "Could not find an active job that matches what is specified",
      });
    }

    const applicants = await Applicant.find({
      ...buildApplicantJobQuery(job),
      user_id: userId,
    }).lean();

    if (applicants.length === 0) {
      return res.status(404).json({
        data_error: `No active applicants for the job ${job.job_title} yet`,
      });
    }

    const hydratedApplicants = await hydrateApplicantsWithResumeText(
      job,
      applicants,
    );

    const run = await ScreeningRunModel.create({
      job_id: job._id,
      job_title: job.job_title,
      applicant_ids: hydratedApplicants.map((applicant) => applicant._id),
      topK: Number(job.job_shortlist_size) === 20 ? 20 : 10,
      status: "running",
      model: env.GOOGLE_AI_MODEL || "deterministic+gemini",
      started_at: new Date(),
    });
    runId = trimText(run._id);

    const evaluated = await evaluateApplicantsForJob({
      runId: run._id,
      job,
      applicants: hydratedApplicants,
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
    await Job.findOneAndUpdate(
      { _id: job._id, user_id: userId },
      { job_state: "Complete" },
    );

    return res.status(200).json({
      success: {
        job_title: job.job_title,
        applicants_details: evaluated.shortlist.map((item) => ({
          applicant_id: item.candidate_id,
          applicant_name:
            hydratedApplicants.find((applicant) => applicant._id === item.candidate_id)
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
    if (runId) {
      await ScreeningRunModel.findByIdAndUpdate(runId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    console.error("Error in runScreening:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getScreeningRuns(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const jobId = trimText(req.query.jobId);
    if (jobId) {
      const ownedJob = await Job.findOne({ _id: jobId, user_id: userId }).lean();
      if (!ownedJob) {
        return res.status(404).json({ data_error: "Job not found" });
      }
    }

    const ownedJobs = await Job.find({ user_id: userId }).select("_id").lean();
    const ownedJobIds = ownedJobs.map((job) => trimText(job._id)).filter(Boolean);
    const query = jobId ? { job_id: jobId } : { job_id: { $in: ownedJobIds } };
    const { page, pageSize, skip, limit } = parsePagination(req.query);
    const [totalRuns, runs] = await Promise.all([
      ScreeningRunModel.countDocuments(query),
      ScreeningRunModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      runs,
      pagination: buildPaginationMeta(totalRuns, page, pageSize),
    });
  } catch (error) {
    console.error("Error in getScreeningRuns:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getScreeningRunById(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const runId = trimText(req.params.runId);
    const { page, pageSize, skip, limit } = parsePagination(req.query);
    const run = await ScreeningRunModel.findById(runId).lean();

    if (!run) {
      return res.status(404).json({ data_error: "Run not found" });
    }

    const ownedJob = await Job.findOne({
      _id: trimText(run.job_id),
      user_id: userId,
    }).lean();
    if (!ownedJob) {
      return res.status(404).json({ data_error: "Run not found" });
    }

    const [totalResults, results] = await Promise.all([
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
      pagination: buildPaginationMeta(totalResults, page, pageSize),
    });
  } catch (error) {
    console.error("Error in getScreeningRunById:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function getLatestJobResults(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const jobId = trimText(req.params.jobId);
    const { page, pageSize, skip, limit } = parsePagination(req.query);
    const job = await withMongoTransientRetry(() =>
      Job.findOne({ _id: jobId, user_id: userId })
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

    const [totalResults, results] = await Promise.all([
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
      pagination: buildPaginationMeta(totalResults, page, pageSize),
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
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const verdictInput = req.body?.verdict_string;
    const verdicts = Array.isArray(verdictInput)
      ? verdictInput
      : typeof verdictInput === "string"
        ? JSON.parse(verdictInput)
        : [];

    let updatedCount = 0;
    for (const verdict of verdicts) {
      const applicant = verdict?.applicant_id
        ? await Applicant.findOne({
            _id: trimText(verdict.applicant_id),
            user_id: userId,
          })
        : await Applicant.findOne({
            applicant_name: trimText(verdict?.applicant_name),
            job_title: trimText(verdict?.job_title),
            user_id: userId,
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

export async function reviewApplicant(req: Request, res: Response) {
  try {
    const resultId = trimText(
      req.params.resultId ?? req.body?.result_id ?? req.body?.screening_result_id,
    );
    const additionalInfo = trimText(
      req.body?.additional_info ?? req.body?.additionalInfo,
    );
    const userId = req.currentUserId;

    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    if (!resultId) {
      return res
        .status(400)
        .json({ data_error: "Screening result id is required" });
    }

    if (!additionalInfo) {
      return res.status(400).json({
        data_error: "Additional review information is required",
      });
    }

    const existingResult = await ScreeningResultModel.findById(resultId).lean();
    if (!existingResult) {
      return res.status(404).json({ data_error: "Screening result not found" });
    }

    const [job, applicant] = await Promise.all([
      Job.findOne({ _id: existingResult.job_id, user_id: userId }).lean(),
      Applicant.findOne({ _id: existingResult.applicant_id, user_id: userId }).lean(),
    ]);

    if (!job) {
      return res.status(404).json({
        data_error: "Job not found for this screening result",
      });
    }

    if (!applicant) {
      return res.status(404).json({
        data_error: "Applicant not found for this screening result",
      });
    }

    if (trimText(existingResult.overall?.verdict) !== "Review") {
      return res.status(400).json({
        data_error: "Only applicants in the Review bucket can be re-reviewed",
      });
    }

    const auth = resolveGeminiAuth();
    if (!auth) {
      return res.status(400).json({
        data_error:
          "Gemini is not configured. Configure GOOGLE_API_KEY or Vertex settings first.",
      });
    }

    const reviewed = await reviewApplicantWithGemini({
      ...auth,
      model: trimText(env.GOOGLE_AI_MODEL) || "gemini-1.5-flash",
      job,
      candidate: applicant,
      additionalInfo,
      currentResult: {
        score: Number(existingResult.overall?.score) || 0,
        verdict: trimText(existingResult.overall?.verdict) || "Review",
        summary: trimText(existingResult.overall?.summary),
        strengths: Array.isArray(existingResult.strengths)
          ? existingResult.strengths.map((item) => trimText(item)).filter(Boolean)
          : [],
        gaps: Array.isArray(existingResult.gaps)
          ? existingResult.gaps.map((item) => trimText(item)).filter(Boolean)
          : [],
        recommendation: trimText(existingResult.recommendation),
      },
    });

    const updatedResult = await ScreeningResultModel.findByIdAndUpdate(
      resultId,
      {
        overall: {
          ...existingResult.overall,
          score: reviewed.matchScore,
          grade: reviewed.grade,
          verdict: reviewed.verdict,
          summary: reviewed.summary,
        },
        strengths: reviewed.strengths,
        gaps: reviewed.gaps,
        recommendation: reviewed.recommendation,
        manual_review: {
          additional_info: additionalInfo,
          previous_verdict: trimText(existingResult.overall?.verdict) || "Review",
          updated_verdict: reviewed.verdict,
          reviewed_at: new Date(),
        },
      },
      { new: true },
    ).lean();

    await Applicant.findOneAndUpdate(
      { _id: existingResult.applicant_id, user_id: userId },
      {
        shortlisted: reviewed.verdict === "Shortlisted",
        applicant_state:
          reviewed.verdict === "Shortlisted"
            ? "Shortlisted"
            : "Rejected",
      },
    );

    return res.status(200).json({
      success: "Applicant reviewed successfully",
      result: updatedResult,
    });
  } catch (error) {
    console.error("Error in reviewApplicant:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function finalizeJobRecruiting(req: Request, res: Response) {
  try {
    const jobId = trimText(req.params.jobId ?? req.body?.job_id ?? req.body?.jobId);
    const userId = req.currentUserId;
    const decisionInput = req.body?.decisions;
    const decisions = Array.isArray(decisionInput) ? decisionInput : [];

    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    if (!jobId) {
      return res.status(400).json({ data_error: "Job id is required" });
    }

    if (decisions.length === 0) {
      return res.status(400).json({ data_error: "At least one recruiter decision is required" });
    }

    const job = await Job.findOne({ _id: jobId, user_id: userId }).lean();
    if (!job) {
      return res.status(404).json({ data_error: "Job not found" });
    }

    const normalizedDecisions = decisions
      .map((item) => {
        const record = item && typeof item === "object" ? item : {};
        const resultId = trimText((record as any).result_id ?? (record as any).resultId);
        const applicantId = trimText((record as any).applicant_id ?? (record as any).applicantId);
        const verdict = trimText((record as any).verdict);
        return {
          resultId,
          applicantId,
          verdict: verdict === "Shortlisted" ? "Shortlisted" : verdict === "Rejected" ? "Rejected" : "",
        };
      })
      .filter((item) => item.verdict && (item.resultId || item.applicantId));

    if (normalizedDecisions.length !== decisions.length) {
      return res.status(400).json({
        data_error: "Each recruiter decision must include a valid verdict and result/applicant id",
      });
    }

    const latestRun = await ScreeningRunModel.findOne({ job_id: jobId })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestRun) {
      return res.status(404).json({ data_error: "No screening run found for this job" });
    }

    const resultIds = normalizedDecisions.map((item) => item.resultId).filter(Boolean);
    const applicantIds = normalizedDecisions.map((item) => item.applicantId).filter(Boolean);

    const results = await ScreeningResultModel.find({
      job_id: jobId,
      screening_run_id: latestRun._id,
      $or: [
        ...(resultIds.length > 0 ? [{ _id: { $in: resultIds } }] : []),
        ...(applicantIds.length > 0 ? [{ applicant_id: { $in: applicantIds } }] : []),
      ],
    }).lean();

    const resultById = new Map(results.map((item) => [trimText(item._id), item]));
    const resultByApplicantId = new Map(
      results.map((item) => [trimText(item.applicant_id), item]),
    );

    let finalizedCount = 0;

    for (const decision of normalizedDecisions) {
      const result =
        (decision.resultId ? resultById.get(decision.resultId) : undefined) ??
        (decision.applicantId ? resultByApplicantId.get(decision.applicantId) : undefined);

      if (!result) {
        continue;
      }

      const applicantId = trimText(result.applicant_id);
      await Promise.all([
        ScreeningResultModel.findByIdAndUpdate(result._id, {
          recruiter_decision: {
            verdict: decision.verdict,
            decided_at: new Date(),
          },
        }),
        Applicant.findOneAndUpdate(
          { _id: applicantId, user_id: userId },
          {
            shortlisted: decision.verdict === "Shortlisted",
            applicant_state: decision.verdict,
          },
        ),
      ]);

      finalizedCount += 1;
    }
    const emailSummary = await processOutcomeEmailsForJob({
      userId,
      job,
    });

    return res.status(200).json({
      success: "Recruiter decisions finalized successfully",
      finalizedCount,
      ...emailSummary,
    });
  } catch (error) {
    console.error("Error in finalizeJobRecruiting:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function sendEmails(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const job = await resolveJobForOutcomeEmails({
      userId,
      jobId: req.body?.job_id ?? req.body?.jobId,
      jobTitle: req.body?.job_title,
    });

    if (!job) {
      return res.status(404).json({
        data_error: "Job not found. Provide a valid job_id or job_title.",
      });
    }

    const emailSummary = await processOutcomeEmailsForJob({
      userId,
      job,
    });

    return res.status(200).json({
      success: "Applicant outcome emails processed successfully",
      ...emailSummary,
    });
  } catch (error) {
    console.error("Error in sendEmails:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

export async function askAssistant(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const jobId = trimText(req.body?.job_id);
    const question = trimText(req.body?.question);
    if (!question) {
      return res.status(400).json({ data_error: "Question is required" });
    }

    const [job, candidates, latestRun] = await Promise.all([
      jobId ? Job.findOne({ _id: jobId, user_id: userId }).lean() : null,
      jobId
        ? Applicant.find({ job_id: jobId, user_id: userId }).lean()
        : Applicant.find({ user_id: userId }).limit(20).lean(),
      jobId
        ? ScreeningRunModel.findOne({ job_id: jobId }).sort({ createdAt: -1 }).lean()
        : null,
    ]);

    if (jobId && !job) {
      return res.status(404).json({ data_error: "Job not found" });
    }

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
