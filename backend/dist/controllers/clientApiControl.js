import * as excel from "exceljs";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "node:path";
import { Readable } from "node:stream";
import unzipper from "unzipper";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import Result from "../models/ScreenResult.js";
import env from "../config/env.js";
import { buildDashboardStats, mapApplicantToFrontend, mapJobToFrontend, } from "../utils/frontendMappers.js";
function trimText(value) {
    return String(value ?? "").trim();
}
function splitList(value) {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((item) => trimText(item)).filter(Boolean);
    }
    return trimText(value)
        .split(/[\n,;|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function joinList(value) {
    return value.map((item) => item.trim()).filter(Boolean).join(", ");
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function normalizeApplicantKey(value) {
    return value
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function inferApplicantEmail(input) {
    const directEmail = trimText(input.applicant_email);
    if (directEmail) {
        return directEmail;
    }
    const additionalEmail = input.additional_info.find((item) => /\S+@\S+\.\S+/.test(item));
    if (additionalEmail) {
        return additionalEmail;
    }
    const applicantSlug = slugify(input.applicant_name || "candidate");
    const jobSlug = slugify(input.job_title || "role");
    return `${applicantSlug}-${jobSlug}@local.rankwise`;
}
function parseExperience(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        return 0;
    }
    return numeric;
}
function normalizeCandidateInput(input) {
    const applicantName = trimText(input?.applicant_name ?? input?.name);
    const jobTitle = trimText(input?.job_title ?? input?.role ?? input?.position);
    if (!applicantName || !jobTitle) {
        return null;
    }
    const additionalInfo = splitList(input?.additional_info ??
        input?.additional_information ??
        input?.notes ??
        input?.linkedin);
    if (trimText(input?.linkedin)) {
        additionalInfo.push(trimText(input.linkedin));
    }
    return {
        applicant_name: applicantName,
        applicant_email: trimText(input?.applicant_email ?? input?.email) || undefined,
        job_title: jobTitle,
        skills: splitList(input?.skills ?? input?.technical_skills),
        education_certificates: splitList(input?.education_certificates ?? input?.education ?? input?.certifications),
        additional_info: Array.from(new Set(additionalInfo.filter(Boolean))),
        experience_in_years: parseExperience(input?.experience_in_years ?? input?.experience ?? input?.years_experience),
    };
}
function headerKey(value) {
    return trimText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_");
}
function cellValue(value) {
    if (value == null) {
        return "";
    }
    if (typeof value === "object" && value !== null && "text" in value) {
        return trimText(value.text);
    }
    return trimText(value);
}
function worksheetToRecords(worksheet) {
    const records = [];
    let headers = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const values = Array.isArray(row.values)
            ? row.values.slice(1).map((value) => cellValue(value))
            : [];
        if (rowNumber === 1) {
            headers = values.map((value) => headerKey(value));
            return;
        }
        const record = {};
        headers.forEach((header, index) => {
            if (!header) {
                return;
            }
            record[header] = values[index] ?? "";
        });
        if (Object.values(record).some(Boolean)) {
            records.push(record);
        }
    });
    return records;
}
async function readSpreadsheet(file) {
    const isCsv = file.originalname.toLowerCase().endsWith(".csv") ||
        file.mimetype === "text/csv";
    if (isCsv) {
        const workbook = new excel.Workbook();
        const worksheet = await workbook.csv.read(Readable.from(Buffer.from(file.buffer)));
        return worksheetToRecords(worksheet);
    }
    const workbook = new excel.Workbook();
    await workbook.xlsx.load(Buffer.from(file.buffer));
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        return [];
    }
    return worksheetToRecords(worksheet);
}
async function createApplicantsFromInputs(inputs) {
    const createdApplicants = [];
    let skippedCount = 0;
    for (const input of inputs) {
        const duplicate = await Applicant.findOne({
            applicant_name: input.applicant_name,
            job_title: input.job_title,
        });
        if (duplicate) {
            skippedCount += 1;
            continue;
        }
        const applicant = await Applicant.create({
            applicant_name: input.applicant_name,
            applicant_email: inferApplicantEmail(input),
            job_title: input.job_title,
            skills: joinList(input.skills),
            education: joinList(input.education_certificates),
            experience: input.experience_in_years,
            additional_info: joinList(input.additional_info),
        });
        createdApplicants.push(applicant);
    }
    return {
        applicants: createdApplicants.map(mapApplicantToFrontend),
        createdCount: createdApplicants.length,
        skippedCount,
    };
}
async function loadFrontendSnapshot() {
    const applicants = await Applicant.find().sort({ updatedAt: -1, createdAt: -1 });
    const mappedApplicants = applicants.map(mapApplicantToFrontend);
    const jobs = await Job.find().sort({ updatedAt: -1, createdAt: -1 });
    const mappedJobs = jobs.map((job) => mapJobToFrontend(job, mappedApplicants));
    return {
        applicants,
        mappedApplicants,
        jobs,
        mappedJobs,
    };
}
function buildExampleForm(payload) {
    return {
        FULL_NAME: "ALEX RECRUITER SAMPLE",
        EMAIL: "alex.sample@example.com",
        PHONE: "+250700000000",
        TARGET_ROLE: payload.job_title.toUpperCase(),
        EXPERIENCE_LEVEL: payload.job_experience_required.toUpperCase(),
        CORE_STRENGTHS: payload.job_ai_criteria.map((criterion) => criterion.criteria_string.toUpperCase()),
    };
}
function splitKeywords(value) {
    return Array.from(new Set(value
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)));
}
function detectRequiredYears(experienceLevel) {
    const normalized = experienceLevel.toLowerCase();
    const explicitNumber = normalized.match(/\d+/);
    if (explicitNumber) {
        return Number(explicitNumber[0]);
    }
    if (normalized.includes("lead")) {
        return 7;
    }
    if (normalized.includes("senior")) {
        return 5;
    }
    if (normalized.includes("mid")) {
        return 3;
    }
    if (normalized.includes("junior")) {
        return 1;
    }
    return 2;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Math.round(value)));
}
function matchScore(candidateTerms, desiredTerms) {
    if (desiredTerms.length === 0) {
        return candidateTerms.length > 0 ? 75 : 40;
    }
    const matches = desiredTerms.filter((desired) => candidateTerms.some((term) => term.includes(desired) || desired.includes(term)));
    return clamp((matches.length / desiredTerms.length) * 100, 0, 100);
}
function scoreApplicant(job, applicant) {
    const criteriaText = Array.isArray(job.job_ai_criteria)
        ? job.job_ai_criteria
            .map((criterion) => `${criterion.criteria_string} ${criterion.description}`)
            .join(", ")
        : "";
    const candidateSkills = splitList(applicant.skills).map((skill) => skill.toLowerCase());
    const candidateEducation = splitList(applicant.education).map((entry) => entry.toLowerCase());
    const desiredTerms = splitKeywords(`${criteriaText} ${job.job_qualifications ?? ""}`);
    const skillsScore = matchScore(candidateSkills, desiredTerms);
    const educationScore = candidateEducation.length > 0 ? 80 : 45;
    const requiredYears = detectRequiredYears(trimText(job.job_experience_required || "mid"));
    const candidateYears = parseExperience(applicant.experience);
    const experienceScore = clamp((candidateYears / requiredYears) * 100, 15, 100);
    const overall = clamp(skillsScore * 0.55 + educationScore * 0.15 + experienceScore * 0.3, 0, 100);
    const matchedSkills = desiredTerms.filter((desired) => candidateSkills.some((skill) => skill.includes(desired) || desired.includes(skill)));
    const topSignals = matchedSkills.slice(0, 3);
    const reasoningParts = [
        topSignals.length > 0
            ? `Matched key signals such as ${topSignals.join(", ")}`
            : "Limited evidence against the strongest must-have signals",
        `${candidateYears} years of reported experience`,
        candidateEducation.length > 0
            ? "Education evidence was provided"
            : "Education details are still limited",
    ];
    return {
        applicant_id: applicant._id.toString(),
        applicant_name: applicant.applicant_name,
        applicant_marks: overall,
        applicant_specification_relevance: {
            skills_relevance: skillsScore,
            education_relevance: educationScore,
        },
        applicant_result_description: `${reasoningParts.join(". ")}.`,
    };
}
async function sendShortlistMessage(email, jobTitle) {
    if (!env.USER_EMAIL || !env.USER_PASS) {
        return false;
    }
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: env.USER_EMAIL,
                pass: env.USER_PASS,
            },
        });
        await transporter.sendMail({
            from: env.USER_EMAIL,
            to: email,
            subject: `You have been shortlisted for ${jobTitle}`,
            text: `You have been shortlisted for ${jobTitle}.`,
        });
        return true;
    }
    catch (error) {
        console.error("Shortlist email skipped:", error);
        return false;
    }
}
export const upload = multer({ storage: multer.memoryStorage() });
export const getDashboardOverview = async (_req, res) => {
    try {
        const { mappedApplicants, mappedJobs } = await loadFrontendSnapshot();
        return res.status(200).json({
            applicants: mappedApplicants,
            jobs: mappedJobs,
            stats: buildDashboardStats(mappedJobs, mappedApplicants),
        });
    }
    catch (error) {
        console.error("Error in getDashboardOverview:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const getJobs = async (_req, res) => {
    try {
        const { mappedApplicants, jobs } = await loadFrontendSnapshot();
        return res.status(200).json({
            jobs: jobs.map((job) => mapJobToFrontend(job, mappedApplicants)),
        });
    }
    catch (error) {
        console.error("Error in getJobs:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const getJob = async (req, res) => {
    try {
        const { mappedApplicants } = await loadFrontendSnapshot();
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ data_error: "Job not found" });
        }
        return res.status(200).json({
            job: mapJobToFrontend(job, mappedApplicants),
        });
    }
    catch (error) {
        console.error("Error in getJob:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const getCandidates = async (_req, res) => {
    try {
        const applicants = await Applicant.find().sort({ updatedAt: -1, createdAt: -1 });
        return res.status(200).json({
            candidates: applicants.map(mapApplicantToFrontend),
        });
    }
    catch (error) {
        console.error("Error in getCandidates:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const getCandidate = async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ data_error: "Candidate not found" });
        }
        return res.status(200).json({
            candidate: mapApplicantToFrontend(applicant),
        });
    }
    catch (error) {
        console.error("Error in getCandidate:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const registerCandidates = async (req, res) => {
    try {
        const requestWithFile = req;
        let inputs = [];
        if (requestWithFile.file) {
            const rows = await readSpreadsheet(requestWithFile.file);
            inputs = rows
                .map((row) => normalizeCandidateInput(row))
                .filter((value) => value !== null);
        }
        else if (Array.isArray(req.body)) {
            inputs = req.body
                .map((item) => normalizeCandidateInput(item))
                .filter((value) => value !== null);
        }
        else if (typeof req.body?.raw_application_data === "string") {
            const rawPayload = JSON.parse(req.body.raw_application_data);
            inputs = Array.isArray(rawPayload)
                ? rawPayload
                    .map((item) => normalizeCandidateInput(item))
                    .filter((value) => value !== null)
                : [];
        }
        else {
            const singleInput = normalizeCandidateInput(req.body);
            inputs = singleInput ? [singleInput] : [];
        }
        if (inputs.length === 0) {
            return res
                .status(400)
                .json({ data_error: "Info about the applicants required" });
        }
        const result = await createApplicantsFromInputs(inputs);
        return res.status(201).json({
            success: "Applicants processed successfully",
            ...result,
        });
    }
    catch (error) {
        console.error("Error in registerCandidates:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const uploadResumeZip = async (req, res) => {
    try {
        const requestWithFile = req;
        const file = requestWithFile.file;
        if (!file) {
            return res.status(400).json({ data_error: "Resume ZIP file required" });
        }
        const directory = await unzipper.Open.buffer(Buffer.from(file.buffer));
        const entries = directory.files.filter((entry) => entry.path.toLowerCase().endsWith(".pdf"));
        const matchedApplicants = [];
        for (const entry of entries) {
            const fileName = path.parse(entry.path).name;
            const applicant = await Applicant.findOne({
                applicant_name: new RegExp(`^${normalizeApplicantKey(fileName).replace(/\s+/g, "\\s+")}$`, "i"),
            });
            if (!applicant) {
                continue;
            }
            const existingResume = await Resume.findOne({
                applicant_id: applicant._id,
                resume_pdf_url: `local://resumes/${entry.path}`,
            });
            if (!existingResume) {
                await Resume.create({
                    applicant_id: applicant._id,
                    job_title: applicant.job_title,
                    resume_pdf_url: `local://resumes/${entry.path}`,
                });
            }
            matchedApplicants.push(applicant.applicant_name);
        }
        return res.status(201).json({
            success: "Successfully uploaded resume PDFs",
            uploadedCount: matchedApplicants.length,
            applicants: matchedApplicants,
        });
    }
    catch (error) {
        console.error("Error in uploadResumeZip:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const createJob = async (req, res) => {
    try {
        const payload = (req.body?.reqBody ?? req.body);
        if (!trimText(payload?.job_title) ||
            !trimText(payload?.job_department) ||
            !trimText(payload?.job_location) ||
            !trimText(payload?.job_description)) {
            return res.status(400).json({ data_error: "Incorrect job structure" });
        }
        const oldJob = await Job.findOne({ job_title: payload.job_title.trim() });
        if (oldJob) {
            return res.status(409).json({ message: "Job already registered" });
        }
        const currentUser = req.currentUserId
            ? await User.findById(req.currentUserId)
            : null;
        const jobPayload = {
            job_title: payload.job_title.trim(),
            job_department: payload.job_department.trim(),
            job_location: payload.job_location.trim(),
            job_employment_type: payload.job_employment_type.trim(),
            company_name: currentUser?.company_name ?? "Independent Recruiter",
            job_experience_required: payload.job_experience_required.trim(),
            job_description: payload.job_description.trim(),
            job_ai_criteria: Array.isArray(payload.job_ai_criteria)
                ? payload.job_ai_criteria
                : [],
            job_shortlist_size: payload.job_shortlist_size === 20 ? 20 : 10,
            job_responsibilities: payload.job_responsibilities.trim(),
            job_qualifications: payload.job_qualifications.trim(),
            workers_required: payload.workers_required ?? 1,
            job_state: trimText(payload.job_state) || "Active",
            job_example_form: buildExampleForm({
                job_title: payload.job_title.trim(),
                job_experience_required: payload.job_experience_required.trim(),
                job_ai_criteria: Array.isArray(payload.job_ai_criteria)
                    ? payload.job_ai_criteria
                    : [],
            }),
            ...(typeof payload.job_salary_min === "number"
                ? { job_salary_min: payload.job_salary_min }
                : {}),
            ...(typeof payload.job_salary_max === "number"
                ? { job_salary_max: payload.job_salary_max }
                : {}),
        };
        const job = await Job.create(jobPayload);
        const { mappedApplicants } = await loadFrontendSnapshot();
        return res.status(201).json({
            success: "Job successfully created",
            job: mapJobToFrontend(job, mappedApplicants),
        });
    }
    catch (error) {
        console.error("Error in createJob:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const runScreening = async (req, res) => {
    try {
        const jobId = trimText(req.body?.jobId);
        const jobTitle = trimText(req.body?.jobTitle);
        const job = jobId
            ? await Job.findById(jobId)
            : await Job.findOne({ job_title: jobTitle });
        if (!job) {
            return res.status(404).json({
                data_error: "Could not find an active job that matches what is specified",
            });
        }
        const applicants = await Applicant.find({ job_title: job.job_title });
        if (applicants.length === 0) {
            return res.status(404).json({
                data_error: `No active applicants for the job ${job.job_title} yet`,
            });
        }
        const applicantsDetails = applicants
            .map((applicant) => scoreApplicant(job, applicant))
            .sort((left, right) => right.applicant_marks - left.applicant_marks);
        const shortlistSize = Number(job.job_shortlist_size) === 20 ? 20 : 10;
        const topCandidates = applicantsDetails
            .slice(0, shortlistSize)
            .map((applicant) => applicant.applicant_name)
            .join(", ");
        const resultVerdict = `Screened ${applicantsDetails.length} applicants for ${job.job_title}. Top candidates based on the available profile evidence: ${topCandidates || "none yet"}.`;
        await Result.create({
            job_title: job.job_title,
            applicants_details: applicantsDetails,
            result_verdict: resultVerdict,
        });
        job.job_state = "Complete";
        await job.save();
        return res.status(200).json({
            success: {
                job_title: job.job_title,
                applicants_details: applicantsDetails,
                result_verdict: resultVerdict,
            },
        });
    }
    catch (error) {
        console.error("Error in runScreening:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export const reviewResult = async (req, res) => {
    try {
        const verdictInput = req.body?.verdict_string;
        const verdicts = Array.isArray(verdictInput)
            ? verdictInput
            : typeof verdictInput === "string"
                ? JSON.parse(verdictInput)
                : [];
        let updatedCount = 0;
        for (const verdict of verdicts) {
            const applicant = await Applicant.findOne({
                applicant_name: trimText(verdict?.applicant_name),
                job_title: trimText(verdict?.job_title),
            });
            if (!applicant) {
                continue;
            }
            applicant.shortlisted = Boolean(verdict?.shortlisted);
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
};
export const sendEmails = async (req, res) => {
    try {
        const jobTitle = trimText(req.body?.job_title);
        if (!jobTitle) {
            return res.status(400).json({ data_error: "No job name provided" });
        }
        const applicants = await Applicant.find({
            shortlisted: true,
            job_title: jobTitle,
        });
        let sentCount = 0;
        for (const applicant of applicants) {
            if (applicant.applicant_email &&
                (await sendShortlistMessage(applicant.applicant_email, jobTitle))) {
                sentCount += 1;
            }
        }
        return res.status(200).json({
            success: "Shortlist emails processed successfully",
            sentCount,
            shortlistedCount: applicants.length,
        });
    }
    catch (error) {
        console.error("Error in sendEmails:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
//# sourceMappingURL=clientApiControl.js.map