import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import env from "../config/env.js";
import { askRecruiterAssistant } from "../lib/gemini.js";
import { buildRejectedApplicantEmail, buildShortlistedApplicantEmail, } from "../lib/emailTemplates.js";
import { sendMailIfConfigured } from "../lib/mailer.js";
import { evaluateApplicantsForJob } from "../services/screeningService.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { trimText } from "../utils/talentProfile.js";
import { isMongoTransientError, withMongoTransientRetry, } from "../utils/mongoErrors.js";
function latestRunSummary(jobTitle, shortlist) {
    const topNames = shortlist.map((item) => item.candidate_id).join(", ");
    return `Screened ${shortlist.length} top candidates for ${jobTitle}. Shortlist ready for recruiter review: ${topNames || "none"}.`;
}
function buildApplicantJobQuery(job) {
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
async function hydrateApplicantsWithResumeText(job, applicants) {
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
    const resumeTextByApplicantId = new Map();
    for (const resume of resumes) {
        const applicantId = trimText(resume?.applicant_id);
        const parsedText = trimText(resume?.parsed_text);
        if (!applicantId || !parsedText || resumeTextByApplicantId.has(applicantId)) {
            continue;
        }
        resumeTextByApplicantId.set(applicantId, parsedText);
    }
    if (resumeTextByApplicantId.size === 0) {
        return applicants;
    }
    await Promise.all(Array.from(resumeTextByApplicantId.entries()).map(([applicantId, resumeText]) => Applicant.findByIdAndUpdate(applicantId, { resume_text: resumeText })));
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
export async function runScreening(req, res) {
    let runId = "";
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
        const applicants = await Applicant.find(buildApplicantJobQuery(job)).lean();
        if (applicants.length === 0) {
            return res.status(404).json({
                data_error: `No active applicants for the job ${job.job_title} yet`,
            });
        }
        const hydratedApplicants = await hydrateApplicantsWithResumeText(job, applicants);
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
        await ScreeningResultModel.insertMany(evaluated.results.map((item) => ({
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
        })));
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
                    applicant_name: hydratedApplicants.find((applicant) => applicant._id === item.candidate_id)
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
    }
    catch (error) {
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
export async function getScreeningRuns(req, res) {
    try {
        const jobId = trimText(req.query.jobId);
        const query = jobId ? { job_id: jobId } : {};
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
    }
    catch (error) {
        console.error("Error in getScreeningRuns:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
export async function getScreeningRunById(req, res) {
    try {
        const runId = trimText(req.params.runId);
        const { page, pageSize, skip, limit } = parsePagination(req.query);
        const run = await ScreeningRunModel.findById(runId).lean();
        if (!run) {
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
    }
    catch (error) {
        console.error("Error in getScreeningRunById:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
export async function getLatestJobResults(req, res) {
    try {
        const jobId = trimText(req.params.jobId);
        const { page, pageSize, skip, limit } = parsePagination(req.query);
        const job = await withMongoTransientRetry(() => Job.findById(jobId)
            .select({ _id: 1, job_title: 1, job_state: 1 })
            .lean());
        if (!job) {
            return res.status(404).json({ data_error: "Job not found" });
        }
        const latestRun = await withMongoTransientRetry(() => ScreeningRunModel.findOne({ job_id: jobId })
            .sort({ createdAt: -1 })
            .lean());
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
            withMongoTransientRetry(() => ScreeningResultModel.countDocuments({
                screening_run_id: latestRun._id,
            })),
            withMongoTransientRetry(() => ScreeningResultModel.find({
                screening_run_id: latestRun._id,
            })
                .sort({ rank: 1 })
                .skip(skip)
                .limit(limit)
                .lean()),
        ]);
        return res.status(200).json({
            run: latestRun,
            results,
            pagination: buildPaginationMeta(totalResults, page, pageSize),
        });
    }
    catch (error) {
        console.error("Error in getLatestJobResults:", error);
        if (isMongoTransientError(error)) {
            return res.status(503).json({
                server_error: "Database connection is temporarily unavailable. Please retry shortly.",
            });
        }
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
export async function reviewResult(req, res) {
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
    }
    catch (error) {
        console.error("Error in reviewResult:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
export async function sendEmails(req, res) {
    try {
        const jobTitle = trimText(req.body?.job_title);
        if (!jobTitle) {
            return res.status(400).json({ data_error: "No job name provided" });
        }
        const applicants = await Applicant.find({ job_title: jobTitle }).lean();
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
        for (const applicant of shortlistedApplicants) {
            const recipient = trimText(applicant.applicant_email || applicant.email);
            if (!recipient) {
                continue;
            }
            const mail = buildShortlistedApplicantEmail({
                applicantName: trimText(applicant.applicant_name) || "Applicant",
                jobTitle,
            });
            const sent = await sendMailIfConfigured({
                to: recipient,
                subject: mail.subject,
                text: mail.text,
                html: mail.html,
            });
            if (sent) {
                shortlistedSentCount += 1;
            }
        }
        for (const applicant of rejectedApplicants) {
            const recipient = trimText(applicant.applicant_email || applicant.email);
            if (!recipient) {
                continue;
            }
            const mail = buildRejectedApplicantEmail({
                applicantName: trimText(applicant.applicant_name) || "Applicant",
                jobTitle,
            });
            const sent = await sendMailIfConfigured({
                to: recipient,
                subject: mail.subject,
                text: mail.text,
                html: mail.html,
            });
            if (sent) {
                rejectedSentCount += 1;
            }
        }
        const sentCount = env.USER_EMAIL && env.USER_PASS
            ? shortlistedSentCount + rejectedSentCount
            : shortlistedApplicants.length + rejectedApplicants.length;
        return res.status(200).json({
            success: "Applicant outcome emails processed successfully",
            sentCount,
            shortlistedCount: shortlistedApplicants.length,
            rejectedCount: rejectedApplicants.length,
            shortlistedSentCount: env.USER_EMAIL && env.USER_PASS
                ? shortlistedSentCount
                : shortlistedApplicants.length,
            rejectedSentCount: env.USER_EMAIL && env.USER_PASS
                ? rejectedSentCount
                : rejectedApplicants.length,
        });
    }
    catch (error) {
        console.error("Error in sendEmails:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
export async function askAssistant(req, res) {
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
    }
    catch (error) {
        console.error("Error in askAssistant:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
//# sourceMappingURL=screeningApi.js.map