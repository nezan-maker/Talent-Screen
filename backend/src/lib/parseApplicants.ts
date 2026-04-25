import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import pdf from "pdf-parse";
import { z } from "zod";

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

const normalizeHeader = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");

function splitList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function mapRow(row: Record<string, unknown>): ParsedApplicant {
  const out: ParsedApplicant = { raw: row };

  // Accept common column names (teams can adapt frontend to match these)
  const get = (names: string[]) => {
    for (const name of names) {
      const key = Object.keys(row).find((k) => normalizeHeader(k) === name);
      if (key) return row[key];
    }
    return undefined;
  };

  const fullName = get(["full name", "name", "candidate name"]);
  const email = get(["email", "email address"]);
  const phone = get(["phone", "phone number", "mobile"]);
  const location = get(["location", "city", "country"]);
  const skills = get(["skills", "skill", "tech stack", "technology"]);
  const yearsExp = get(["years experience", "experience years", "yoe", "years of experience"]);
  const education = get(["education", "degree", "qualification"]);
  const links = get(["links", "portfolio", "github", "linkedin", "url"]);
  const resumeText = get(["resume text", "resume", "cv text"]);

  if (typeof fullName === "string") out.fullName = fullName.trim();
  if (typeof email === "string") out.email = email.trim();
  if (typeof phone === "string") out.phone = phone.trim();
  if (typeof location === "string") out.location = location.trim();
  out.skills = splitList(skills);
  out.education = splitList(education);
  out.links = splitList(links);
  out.yearsExperience = toNumber(yearsExp);
  if (typeof resumeText === "string" && resumeText.trim()) out.resumeText = resumeText.trim();

  return out;
}

export async function parsePdfResume(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return (data.text ?? "").replace(/\s+\n/g, "\n").trim();
}

export function parseCsvApplicants(buffer: Buffer): ParsedApplicant[] {
  const text = buffer.toString("utf8");
  const rows = parseCsv(text, { columns: true, skip_empty_lines: true, trim: true });
  const arrSchema = z.array(z.record(z.unknown()));
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
      obj[key] = cell.text ?? "";
    });
    rows.push(obj);
  });

  return rows.map(mapRow).filter((a) => a.fullName || a.email || a.resumeText);
}

