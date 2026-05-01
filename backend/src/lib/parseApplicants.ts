import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import {
  extractCellText,
  extractEmailFromText,
  extractLinksFromText,
  parseResumeHeuristics,
  pickBestRecordValue,
} from "../utils/applicantParsing.js";

export type ParsedApplicant = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  yearsExperience?: number;
  education?: string[];
  links?: string[];
  resumeText?: string;
  raw?: unknown;
};

function splitList(value: unknown): string[] {
  return extractCellText(value)
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = extractCellText(value);
  if (!text) {
    return undefined;
  }
  const direct = Number(text);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const yearsMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\b/i);
  if (yearsMatch) {
    const parsed = Number(yearsMatch[1]);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function mapRow(row: Record<string, unknown>): ParsedApplicant {
  const out: ParsedApplicant = { raw: row };

  const get = (names: string[]) => pickBestRecordValue(row, names);

  const fullName = get([
    "full name",
    "name",
    "candidate name",
    "applicant name",
    "fullname",
  ]);
  const emailValue = get([
    "email",
    "email address",
    "applicant email",
    "mail",
  ]);
  const phone = get(["phone", "phone number", "mobile", "telephone"]);
  const location = get(["location", "city", "country", "address"]);
  const skills = get([
    "skills",
    "skill",
    "tech stack",
    "technology",
    "technical skills",
  ]);
  const yearsExp = get([
    "years experience",
    "experience years",
    "yoe",
    "years of experience",
    "experience in years",
  ]);
  const education = get(["education", "degree", "qualification"]);
  const linksValue = get([
    "links",
    "url",
    "website",
  ]);
  const linkedinValue = get(["linkedin", "linked in", "linkedin url"]);
  const githubValue = get(["github", "github url", "git hub"]);
  const portfolioValue = get(["portfolio", "website", "personal site"]);
  const bioValue = get(["bio", "summary", "professional summary"]);
  const resumeText = get(["resume text", "resume", "cv text"]);

  if (fullName) out.fullName = fullName;
  const directEmail = extractEmailFromText(emailValue);
  if (directEmail) {
    out.email = directEmail;
  }
  if (phone) out.phone = phone;
  if (location) out.location = location;
  out.skills = splitList(skills);
  out.education = splitList(education);
  out.links = Array.from(
    new Set([
      ...extractLinksFromText(linksValue).all,
      ...extractLinksFromText(linkedinValue).all,
      ...extractLinksFromText(githubValue).all,
      ...extractLinksFromText(portfolioValue).all,
    ]),
  );
  const parsedExp = toNumber(yearsExp);
  if (parsedExp !== undefined) out.yearsExperience = parsedExp;
  if (resumeText) {
    out.resumeText = resumeText;
    const heuristic = parseResumeHeuristics(resumeText);
    if (!out.fullName && heuristic.applicant_name) out.fullName = heuristic.applicant_name;
    if (!out.email && heuristic.email) out.email = heuristic.email;
    if (!out.location && heuristic.location) out.location = heuristic.location;
    if ((!out.skills || out.skills.length === 0) && heuristic.skills) {
      out.skills = heuristic.skills.map((item) => item.name);
    }
    if ((!out.education || out.education.length === 0) && heuristic.education) {
      out.education = heuristic.education
        .map((item) => [item.degree, item.field_of_study, item.institution].filter(Boolean).join(" - "))
        .filter(Boolean);
    }
    if ((!out.links || out.links.length === 0) && heuristic.social_links) {
      out.links = [heuristic.social_links.linkedin, heuristic.social_links.github, heuristic.social_links.portfolio]
        .filter(Boolean) as string[];
    }
    if (out.yearsExperience === undefined && typeof heuristic.experience_in_years === "number") {
      out.yearsExperience = heuristic.experience_in_years;
    }
  } else if (bioValue) {
    out.resumeText = bioValue;
  }

  return out;
}

export async function parsePdfResume(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return (data.text ?? "").replace(/\s+\n/g, "\n").trim();
  } finally {
    try {
      await parser.destroy();
    } catch {
      // ignore parser cleanup failures
    }
  }
}

export function parseCsvApplicants(buffer: Buffer): ParsedApplicant[] {
  const text = buffer.toString("utf8");
  const rows = parseCsv(text, { columns: true, skip_empty_lines: true, trim: true });
  const arrSchema = z.array(z.record(z.string(), z.unknown()));
  const parsedRows = arrSchema.parse(rows);
  return parsedRows.map(mapRow).filter((a) => a.fullName || a.email || a.resumeText);
}

export async function parseXlsxApplicants(buffer: Uint8Array): Promise<ParsedApplicant[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const ws = workbook.worksheets[0];
  if (!ws) return [];

  // first row = headers
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.text ?? "").trim();
  });

  const rows: Record<string, unknown>[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber - 1] || `col_${colNumber}`;
      obj[key] = extractCellText(cell.value ?? cell.text ?? "");
    });
    rows.push(obj);
  });

  return rows.map(mapRow).filter((a) => a.fullName || a.email || a.resumeText);
}
