import exceljs from "exceljs";
const { Workbook } = exceljs;
import { Readable } from "node:stream";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import unzipper from "unzipper";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { mapApplicantToFrontend } from "../utils/frontendMappers.js";
import { buildNormalizedApplicant, extractEmailAndLinks, normalizeLookupKey, splitList, trimText, } from "../utils/talentProfile.js";
function worksheetToRecords(worksheet) {
    const records = [];
    let headers = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const values = Array.isArray(row.values)
            ? row.values.slice(1).map((value) => trimText(value))
            : [];
        if (rowNumber === 1) {
            headers = values.map((value) => trimText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_"));
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
    const workbook = new Workbook();
    const isCsv = file.mimetype === "text/csv" ||
        file.originalname.toLowerCase().endsWith(".csv");
    if (isCsv) {
        const worksheet = await workbook.csv.read(Readable.from(Buffer.from(file.buffer)));
        return worksheetToRecords(worksheet);
    }
    await workbook.xlsx.load(Buffer.from(file.buffer));
    const worksheet = workbook.worksheets[0];
    return worksheet ? worksheetToRecords(worksheet) : [];
}
async function createApplicant(normalized) {
    const duplicateQuery = normalized.job_id
        ? {
            job_id: normalized.job_id,
            $or: [
                { applicant_email: normalized.email },
                { applicant_name: normalized.applicant_name },
            ],
        }
        : {
            job_title: normalized.job_title,
            $or: [
                { applicant_email: normalized.email },
                { applicant_name: normalized.applicant_name },
            ],
        };
    const duplicate = await Applicant.findOne(duplicateQuery).lean();
    if (duplicate) {
        return { created: null, skipped: true };
    }
    const applicant = await Applicant.create({
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        applicant_name: normalized.applicant_name,
        email: normalized.email,
        applicant_email: normalized.email,
        headline: normalized.headline,
        bio: normalized.bio,
        location: normalized.location,
        job_id: normalized.job_id ?? null,
        job_title: normalized.job_title,
        skills: normalized.skills,
        languages: normalized.languages,
        experience: normalized.experience,
        education: normalized.education,
        certifications: normalized.certifications,
        projects: normalized.projects,
        availability: normalized.availability,
        social_links: normalized.social_links,
        additional_info: normalized.additional_info,
        resume_text: normalized.resume_text ?? "",
        source: normalized.source,
        shortlisted: normalized.shortlisted,
        applicant_state: normalized.applicant_state,
    });
    return { created: applicant, skipped: false };
}
function normalizeRecord(record, jobs) {
    const applicant_name = trimText(record.applicant_name || record.name) ||
        `${trimText(record.first_name || record.first_name_)} ${trimText(record.last_name || record.last_name_)}`.trim();
    const job_title = trimText(record.job_title || record.role || record.position) ||
        trimText(record.applied_job_title);
    const additionalInfo = splitList(record.additional_info ||
        record.additional_information ||
        record.notes ||
        record.linkedin ||
        "");
    const extracted = extractEmailAndLinks(additionalInfo);
    const job = jobs.find((item) => trimText(item.job_title).toLowerCase() === job_title.toLowerCase());
    return buildNormalizedApplicant({
        first_name: record.first_name,
        last_name: record.last_name,
        applicant_name,
        email: record.email || record.applicant_email || extracted.email,
        headline: record.headline,
        bio: record.bio,
        location: record.location,
        job_id: job?._id ?? trimText(record.job_id),
        job_title: job?.job_title ?? job_title,
        skills: record.skills,
        languages: record.languages || record.language,
        experience: record.experience,
        education: record.education || record.education_certificates,
        certifications: record.certifications,
        projects: record.projects,
        availability: {
            status: record.availability_status || record.status || "Open to Opportunities",
            type: record.availability_type || "Full-time",
            start_date: record.availability_start_date || null,
        },
        social_links: {
            linkedin: record.linkedin || extracted.linkedin,
            github: record.github || extracted.github,
            portfolio: record.portfolio || extracted.portfolio,
        },
        additional_info: additionalInfo,
        source: "upload",
    });
}
export async function registerCandidates(req, res) {
    try {
        const jobs = await Job.find().lean();
        const createdApplicants = [];
        let skippedCount = 0;
        let normalizedRecords = [];
        if (req.file) {
            const records = await readSpreadsheet(req.file);
            normalizedRecords = records
                .map((record) => normalizeRecord(record, jobs))
                .filter((record) => Boolean(record.applicant_name && record.job_title));
        }
        else if (Array.isArray(req.body)) {
            normalizedRecords = req.body.map((item) => buildNormalizedApplicant({
                ...item,
                source: "manual",
            }));
        }
        else {
            return res
                .status(400)
                .json({ data_error: "Applicants array or spreadsheet file required" });
        }
        for (const record of normalizedRecords) {
            const result = await createApplicant(record);
            if (result.skipped) {
                skippedCount += 1;
                continue;
            }
            if (result.created) {
                createdApplicants.push(result.created);
            }
        }
        return res.status(201).json({
            success: "Applicants processed successfully",
            createdCount: createdApplicants.length,
            skippedCount,
            applicants: createdApplicants.map((item) => mapApplicantToFrontend(item.toObject())),
        });
    }
    catch (error) {
        console.error("Error in registerCandidates:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
function normalizeResumeMatchKey(value) {
    return normalizeLookupKey(path.parse(value).name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
}
async function extractPdfText(buffer) {
    const parser = new PDFParse({ data: buffer });
    try {
        const parsed = await parser.getText();
        return trimText(parsed.text);
    }
    finally {
        try {
            await parser.destroy();
        }
        catch {
            // ignore parser cleanup failures
        }
    }
}
export async function uploadResumeZip(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ data_error: "Resume ZIP file required" });
        }
        const directory = await unzipper.Open.buffer(req.file.buffer);
        const applicants = await Applicant.find().lean();
        const uploadedApplicants = [];
        for (const entry of directory.files) {
            if (entry.type !== "File" || !entry.path.toLowerCase().endsWith(".pdf")) {
                continue;
            }
            const entryBuffer = await entry.buffer();
            const parsed_text = await extractPdfText(entryBuffer);
            const lookupKey = normalizeResumeMatchKey(entry.path);
            const applicant = applicants.find((item) => {
                const fullNameKey = normalizeLookupKey(trimText(item.applicant_name));
                const emailKey = normalizeLookupKey(trimText(item.email).split("@")[0] || "");
                const idKey = normalizeLookupKey(trimText(item._id));
                return (fullNameKey === lookupKey || emailKey === lookupKey || idKey === lookupKey);
            });
            if (!applicant) {
                continue;
            }
            await Resume.findOneAndUpdate({ applicant_id: applicant._id, job_id: applicant.job_id ?? null }, {
                applicant_id: applicant._id,
                job_id: applicant.job_id ?? null,
                job_title: applicant.job_title,
                resume_pdf_url: `local://resumes/${entry.path}`,
                file_name: entry.path,
                parsed_text,
            }, { upsert: true, new: true });
            await Applicant.findByIdAndUpdate(applicant._id, {
                resume_text: parsed_text,
            });
            uploadedApplicants.push(trimText(applicant.applicant_name));
        }
        return res.status(201).json({
            success: "Successfully uploaded resume PDFs",
            uploadedCount: uploadedApplicants.length,
            applicants: uploadedApplicants,
        });
    }
    catch (error) {
        console.error("Error in uploadResumeZip:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
//# sourceMappingURL=intakeApi.js.map