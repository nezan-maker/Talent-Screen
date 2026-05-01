import type { Request, Response } from "express";
import exceljs from "exceljs";
import type { Worksheet } from "exceljs";
const { Workbook } = exceljs;
import { Readable } from "node:stream";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import unzipper from "unzipper";
import env from "../config/env.js";
import {
  parseResumeObjectFieldsWithGemini,
  resolveGeminiAuth,
  type ParsedResumeObjectFields,
} from "../lib/gemini.js";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { mapApplicantToFrontend } from "../utils/frontendMappers.js";
import {
  buildNormalizedApplicant,
  extractEmailAndLinks,
  normalizeLookupKey,
  splitList,
  trimText,
} from "../utils/talentProfile.js";
import {
  extractCellText,
  extractEmailFromText,
  extractLinksFromText,
  parseResumeHeuristics,
  pickBestRecordValue,
} from "../utils/applicantParsing.js";

const RESUME_ZIP_PROCESS_CONCURRENCY = 3;

function getUploadedFile(
  req: Request,
  preferredKeys: string[],
): Express.Multer.File | undefined {
  if (req.file) {
    return req.file;
  }

  const files = req.files;
  if (!files) {
    return undefined;
  }

  if (Array.isArray(files)) {
    return files[0];
  }

  const keyedFiles = files as Record<string, Express.Multer.File[]>;
  for (const key of preferredKeys) {
    const bucket = keyedFiles[key];
    if (Array.isArray(bucket) && bucket.length > 0) {
      return bucket[0];
    }
  }

  return undefined;
}

function pickRecordValue(record: Record<string, string>, keys: string[]) {
  return pickBestRecordValue(record, keys);
}

function mapApplicantStateFromStatus(status: string) {
  const normalized = trimText(status).toLowerCase();
  if (!normalized) {
    return "In Review";
  }

  if (normalized.includes("shortlist")) {
    return "Shortlisted";
  }

  if (normalized.includes("reject")) {
    return "Rejected";
  }

  if (normalized.includes("queue")) {
    return "Queued";
  }

  return "In Review";
}

async function forEachWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  if (items.length === 0) {
    return;
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: safeConcurrency }, async () => {
      while (true) {
        const index = cursor;
        cursor += 1;

        if (index >= items.length) {
          break;
        }

        const item = items[index];
        if (typeof item === "undefined") {
          break;
        }

        await worker(item, index);
      }
    }),
  );
}

function worksheetToRecords(worksheet: Worksheet) {
  const records: Array<Record<string, string>> = [];
  let headers: string[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
    const values: string[] = Array.isArray(row.values)
      ? row.values.slice(1).map((value: any) => extractCellText(value))
      : [];

    if (rowNumber === 1) {
      headers = values.map((value) =>
        trimText(value)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_"),
      );
      return;
    }

    const record: Record<string, string> = {};
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

async function readSpreadsheet(file: Express.Multer.File) {
  const workbook = new Workbook();
  const isCsv =
    file.mimetype === "text/csv" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const worksheet = await workbook.csv.read(
      Readable.from(Buffer.from(file.buffer)) as any,
    );
    return worksheetToRecords(worksheet);
  }

  await workbook.xlsx.load(Buffer.from(file.buffer) as any);
  const worksheet = workbook.worksheets[0];
  return worksheet ? worksheetToRecords(worksheet) : [];
}

async function createApplicant(
  normalized: ReturnType<typeof buildNormalizedApplicant>,
  userId: string,
) {
  const duplicateQuery = normalized.job_id
    ? {
        user_id: userId,
        job_id: normalized.job_id,
        $or: [
          { applicant_email: normalized.email },
          { applicant_name: normalized.applicant_name },
        ],
      }
    : {
        user_id: userId,
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
    user_id: userId,
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

function normalizeRecord(
  record: Record<string, string>,
  jobs: any[],
  defaults?: { jobId?: string; jobTitle?: string },
) {
  const applicant_name =
    pickRecordValue(record, [
      "applicant_name",
      "name",
      "full_name",
      "candidate_name",
    ]) ||
    `${pickRecordValue(record, ["first_name", "first_name_"])} ${pickRecordValue(
      record,
      ["last_name", "last_name_"],
    )}`.trim();
  const job_title =
    pickRecordValue(record, [
      "job_title",
      "role",
      "position",
      "position_applied",
      "applied_position",
      "applied_job_title",
      "title",
    ]) || trimText(defaults?.jobTitle);
  const status = pickRecordValue(record, [
    "status",
    "applicant_state",
    "candidate_status",
  ]);
  const applicant_state = mapApplicantStateFromStatus(status);
  const additionalInfo = splitList(
    [
      pickRecordValue(record, [
        "additional_info",
        "additional_information",
        "notes",
      ]),
      pickRecordValue(record, ["phone", "phone_number", "mobile"]),
      pickRecordValue(record, ["linkedin"]),
      pickRecordValue(record, ["date_applied", "applied_date"]),
      pickRecordValue(record, [
        "score___100_",
        "score_100_",
        "score",
        "candidate_score",
      ]),
    ]
      .filter(Boolean)
      .join(", "),
  );
  const extracted = extractEmailAndLinks(additionalInfo);
  const job = jobs.find(
    (item) =>
      trimText(item.job_title).toLowerCase() === job_title.toLowerCase(),
  );

  return buildNormalizedApplicant({
    first_name: pickRecordValue(record, ["first_name", "frist_name", "firstname"]),
    last_name: pickRecordValue(record, ["last_name", "last_name_", "lastname", "sur_name", "surname"]),
    applicant_name,
    email:
      extractEmailFromText(
        pickRecordValue(record, [
          "email",
          "applicant_email",
          "e_mail",
          "email_address",
          "mail",
        ]),
      ) ||
      extracted.email,
    headline: pickRecordValue(record, [
      "headline",
      "position_applied",
      "job_title",
      "role_headline",
      "tagline",
    ]),
    bio: record.bio,
    location: pickRecordValue(record, ["location", "city", "country"]),
    job_id:
      trimText(job?._id) ||
      pickRecordValue(record, ["job_id"]) ||
      trimText(defaults?.jobId),
    job_title: job?.job_title ?? job_title,
    skills: pickRecordValue(record, [
      "skills",
      "key_skills",
      "technical_skills",
    ]),
    languages: pickRecordValue(record, ["languages", "language", "langauges"]),
    experience: pickRecordValue(record, [
      "experience",
      "work_experience",
      "employment_history",
      "professional_experience",
    ]),
    education: pickRecordValue(record, [
      "education",
      "education_certificates",
      "qualifications",
      "qualification",
    ]),
    certifications: pickRecordValue(record, [
      "certifications",
      "certification",
      "licenses",
    ]),
    projects: pickRecordValue(record, ["projects", "project_work", "portfolio_projects"]),
    experience_in_years: pickRecordValue(record, [
      "experience_in_years",
      "years_experience",
      "yrs_experience",
      "experience_years",
      "years",
    ]),
    availability: {
      status:
        pickRecordValue(record, [
          "availability_status",
          "availability",
          "status",
          "availablity_status",
        ]) || "Open to Opportunities",
      type:
        pickRecordValue(record, [
          "availability_type",
          "employment_type",
          "work_type",
        ]) || "Full-time",
      start_date:
        pickRecordValue(record, [
          "availability_start_date",
          "start_date",
          "available_from",
        ]) || null,
    },
    social_links: {
      linkedin:
        pickRecordValue(record, ["linkedin", "linked_in", "linkedin_url"]) ||
        extracted.linkedin,
      github:
        pickRecordValue(record, ["github", "github_url", "git_hub"]) ||
        extracted.github,
      portfolio:
        pickRecordValue(record, ["portfolio", "website", "personal_site"]) ||
        extracted.portfolio,
    },
    additional_info: additionalInfo,
    source: "upload",
    shortlisted: applicant_state === "Shortlisted",
    applicant_state,
  });
}

export async function registerCandidates(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json("Session expired");
    }
    const jobs = await Job.find({ user_id: userId }).lean();
    const createdApplicants: any[] = [];
    let skippedCount = 0;
    let normalizedRecords: Array<ReturnType<typeof buildNormalizedApplicant>> =
      [];
    const defaultJobTitle = trimText(
      req.body?.default_job_title ?? req.body?.job_title,
    );
    const defaultJobId = trimText(req.body?.default_job_id ?? req.body?.job_id);
    const spreadsheetFile = getUploadedFile(req, [
      "file",
      "applicants_spreadsheet",
    ]);

    if (spreadsheetFile) {
      const records = await readSpreadsheet(spreadsheetFile);
      normalizedRecords = records
        .map((record) =>
          normalizeRecord(record, jobs, {
            jobTitle: defaultJobTitle,
            jobId: defaultJobId,
          }),
        )
        .filter((record) => Boolean(record.applicant_name && record.job_title));
    } else if (Array.isArray(req.body)) {
      normalizedRecords = req.body.map((item) =>
        buildNormalizedApplicant({
          ...item,
          source: "manual",
        }),
      );
    } else {
      return res
        .status(400)
        .json({ data_error: "Applicants array or spreadsheet file required" });
    }

    for (const record of normalizedRecords) {
      const result = await createApplicant(record, userId);
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
      applicants: createdApplicants.map((item) =>
        mapApplicantToFrontend(item.toObject()),
      ),
    });
  } catch (error) {
    console.error("Error in registerCandidates:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}

function normalizeResumeMatchKey(value: string) {
  return normalizeLookupKey(
    path
      .parse(value)
      .name.replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b(resume|cv|curriculum vitae|candidate|profile)\b/gi, " ")
      .replace(/\b[a-z]\d{2,}\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeNameLikeKey(value: string) {
  return normalizeLookupKey(
    trimText(value)
      .replace(/[._-]+/g, " ")
      .replace(/\b(resume|cv|candidate|profile)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function findApplicantForResume(
  applicants: any[],
  lookupKey: string,
  parsedText: string,
) {
  const emailInResume = parsedText.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  )?.[0];
  const normalizedEmailInResume = normalizeLookupKey(
    trimText(emailInResume).toLowerCase(),
  );

  return applicants.find((item) => {
    const fullNameKey = normalizeNameLikeKey(trimText(item.applicant_name));
    const emailLocalKey = normalizeNameLikeKey(
      trimText(item.email).split("@")[0] || "",
    );
    const emailKey = normalizeLookupKey(trimText(item.email).toLowerCase());
    const idKey = normalizeLookupKey(trimText(item._id));

    if (
      fullNameKey === lookupKey ||
      emailLocalKey === lookupKey ||
      idKey === lookupKey
    ) {
      return true;
    }

    if (
      lookupKey.length >= 6 &&
      (fullNameKey.includes(lookupKey) || lookupKey.includes(fullNameKey))
    ) {
      return true;
    }

    if (normalizedEmailInResume && emailKey === normalizedEmailInResume) {
      return true;
    }

    return false;
  });
}

function buildApplicantObjectFieldUpdate(
  applicant: any,
  parsed: ParsedResumeObjectFields | null,
  heuristic: ReturnType<typeof parseResumeHeuristics>,
) {
  const update: Record<string, unknown> = {};
  const parsedOrHeuristic = {
    skills: parsed?.skills ?? heuristic.skills ?? [],
    languages: parsed?.languages ?? heuristic.languages ?? [],
    experience: parsed?.experience ?? heuristic.experience ?? [],
    education: parsed?.education ?? heuristic.education ?? [],
    availability: parsed?.availability ?? heuristic.availability,
    social_links: parsed?.social_links ?? heuristic.social_links,
  };

  if (parsedOrHeuristic.skills.length > 0) {
    update.skills = parsedOrHeuristic.skills;
  }
  if (parsedOrHeuristic.languages.length > 0) {
    update.languages = parsedOrHeuristic.languages;
  }
  if (parsedOrHeuristic.experience.length > 0) {
    update.experience = parsedOrHeuristic.experience;
  }
  if (parsedOrHeuristic.education.length > 0) {
    update.education = parsedOrHeuristic.education;
  }
  if (parsed?.certifications && parsed.certifications.length > 0) {
    update.certifications = parsed.certifications;
  }
  if (parsed?.projects && parsed.projects.length > 0) {
    update.projects = parsed.projects;
  }
  if (parsedOrHeuristic.availability) {
    update.availability = {
      ...(applicant?.availability ?? {}),
      ...parsedOrHeuristic.availability,
    };
  }
  if (parsedOrHeuristic.social_links) {
    update.social_links = {
      ...(applicant?.social_links ?? {}),
      ...parsedOrHeuristic.social_links,
    };
  }
  if (!trimText(applicant?.headline) && heuristic.headline) {
    update.headline = heuristic.headline;
  }
  if (!trimText(applicant?.bio) && heuristic.bio) {
    update.bio = heuristic.bio;
  }
  if (!trimText(applicant?.location) && heuristic.location) {
    update.location = heuristic.location;
  }
  if (!trimText(applicant?.email) && heuristic.email) {
    update.email = heuristic.email;
    update.applicant_email = heuristic.email;
  }
  if (Array.isArray(heuristic.additional_info) && heuristic.additional_info.length > 0) {
    const existing = Array.isArray(applicant?.additional_info) ? applicant.additional_info : [];
    update.additional_info = Array.from(
      new Set(
        [...existing, ...heuristic.additional_info]
          .map((item) => trimText(item))
          .filter(Boolean),
      ),
    );
  }

  return update;
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return trimText(parsed.text);
  } finally {
    try {
      await parser.destroy();
    } catch {
      // ignore parser cleanup failures
    }
  }
}

export async function uploadResumeZip(req: Request, res: Response) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ expiration_error: "Session expired" });
    }

    const resumeZipFile = getUploadedFile(req, ["file", "resume_pdf_zip"]);
    if (!resumeZipFile) {
      return res.status(400).json({ data_error: "Resume ZIP file required" });
    }

    const directory = await unzipper.Open.buffer(resumeZipFile.buffer);
    const defaultJobId = trimText(req.body?.default_job_id ?? req.body?.job_id);
    const defaultJobTitle = trimText(
      req.body?.default_job_title ?? req.body?.job_title,
    );
    if (defaultJobId) {
      const ownedJob = await Job.findOne({ _id: defaultJobId, user_id: userId }).lean();
      if (!ownedJob) {
        return res.status(404).json({
          data_error: "Job not found for this workspace.",
        });
      }
    }

    const applicantScope = [
      ...(defaultJobId ? [{ job_id: defaultJobId }] : []),
      ...(defaultJobTitle ? [{ job_title: defaultJobTitle }] : []),
    ];
    const applicants = await Applicant.find(
      applicantScope.length === 0
        ? { user_id: userId }
        : applicantScope.length === 1
          ? { user_id: userId, ...applicantScope[0] }
          : { user_id: userId, $or: applicantScope },
    ).lean();

    if (applicants.length === 0) {
      return res.status(404).json({
        data_error:
          "No applicants found for resume matching. Upload applicants first or provide the correct job context.",
      });
    }

    const geminiAuth = resolveGeminiAuth();
    const geminiModel = trimText(env.GOOGLE_AI_MODEL) || "gemini-1.5-flash";
    const uploadedApplicants: string[] = [];
    const unmatchedFiles: string[] = [];
    const failedFiles: string[] = [];
    let aiParsedCount = 0;
    let aiSkippedCount = 0;
    let aiFailedCount = 0;

    const pdfEntries = directory.files.filter(
      (entry: any) =>
        entry?.type === "File" &&
        typeof entry?.path === "string" &&
        entry.path.toLowerCase().endsWith(".pdf"),
    );

    if (pdfEntries.length === 0) {
      return res.status(400).json({
        data_error: "No PDF files were found inside the ZIP archive.",
      });
    }

    await forEachWithConcurrency(
      pdfEntries,
      RESUME_ZIP_PROCESS_CONCURRENCY,
      async (entry: any) => {
        const entryPath = trimText(entry?.path) || "unknown.pdf";

        try {
          const entryBuffer = await entry.buffer();
          const parsed_text = await extractPdfText(entryBuffer);
          const heuristicResumeFields = parseResumeHeuristics(parsed_text);
          const lookupKey = normalizeResumeMatchKey(entryPath);

          const applicant = findApplicantForResume(
            applicants,
            lookupKey,
            parsed_text,
          );

          if (!applicant) {
            unmatchedFiles.push(entryPath);
            return;
          }

          await Resume.findOneAndUpdate(
            {
              user_id: userId,
              applicant_id: applicant._id,
              job_id: applicant.job_id ?? null,
            },
            {
              user_id: userId,
              applicant_id: applicant._id,
              job_id: applicant.job_id ?? null,
              job_title: applicant.job_title,
              resume_pdf_url: `local://resumes/${entryPath}`,
              file_name: entryPath,
              parsed_text,
            },
            { upsert: true, new: true },
          );

          let parsedObjectFields: ParsedResumeObjectFields | null = null;
          if (geminiAuth && parsed_text) {
            try {
              parsedObjectFields = await parseResumeObjectFieldsWithGemini({
                ...geminiAuth,
                model: geminiModel,
                resumeText: parsed_text,
                applicantName: trimText(applicant.applicant_name),
                jobTitle: trimText(applicant.job_title),
              });
            } catch (error) {
              console.warn(`Resume enrichment failed for ${entryPath}:`, error);
            }
          } else {
            aiSkippedCount += 1;
          }

          if (geminiAuth && parsed_text) {
            if (parsedObjectFields) {
              aiParsedCount += 1;
            } else {
              aiFailedCount += 1;
            }
          }

          const objectFieldUpdate = buildApplicantObjectFieldUpdate(
            applicant,
            parsedObjectFields,
            heuristicResumeFields,
          );
          await Applicant.findOneAndUpdate(
            { _id: applicant._id, user_id: userId },
            {
              resume_text: parsed_text,
              ...objectFieldUpdate,
            },
          );
          uploadedApplicants.push(trimText(applicant.applicant_name));
        } catch (error) {
          failedFiles.push(entryPath);
          console.warn(`Failed to process resume PDF "${entryPath}":`, error);
        }
      },
    );

    return res.status(201).json({
      success: "Successfully uploaded resume PDFs",
      uploadedCount: uploadedApplicants.length,
      applicants: uploadedApplicants,
      unmatchedCount: unmatchedFiles.length,
      unmatchedFiles: unmatchedFiles.slice(0, 20),
      failedCount: failedFiles.length,
      failedFiles: failedFiles.slice(0, 20),
      aiParsedCount,
      aiFailedCount,
      aiSkippedCount,
    });
  } catch (error) {
    console.error("Error in uploadResumeZip:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
}
