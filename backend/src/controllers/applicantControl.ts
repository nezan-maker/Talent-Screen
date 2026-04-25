import type { Response, Request } from "express";
import * as excel from "exceljs";
import Applicant from "../models/Applicant.js";
import { Readable } from "stream";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import unzipper from "unzipper";
import env from "../config/env.js";
import mongoose from "mongoose";
import axios from "axios";
import * as pdfLib from "pdfjs-dist/legacy/build/pdf.mjs";
import Resume from "../models/Resume.js";
import { controlDebug } from "./authControl.js";
import { string } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface Applicant_ {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
}

export interface Skill {
  name: string;
  level: string;
  years_of_experience: number;
}
export interface Language {
  name: string;
  proficiency: string;
}
export interface Work {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  technologies: string[];
  is_current: boolean;
}
export interface Education {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year: number;
}
export interface Certification {
  name: string;
  issuer: string;
  issuer_date: string;
}
export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  start_date: string;
  end_date: string;
}
export interface Availability {
  status: string;
  type: string;
  start_date: string | null;
}

export interface Social {
  linked_in: string;
  github: string;
  portfolio: string;
}

const applicantControl = async (req: Request, res: Response) => {
  try {
    if (!req.files) {
      if (!req.body)
        return res
          .status(400)
          .json({ data_error: "Info about the applicants required" });
      const { raw_application_data }: { raw_application_data: string } =
        req.body;
      const application_data = JSON.parse(raw_application_data);
      for (let i = 0; i < application_data.length; i++) {
        const current_json: any = application_data[i];

        let applicant_json: Applicant_ = {
          first_name: current_json.first_name || current_json.applicant_name?.split(" ")[0] || "",
          last_name: current_json.last_name || current_json.applicant_name?.split(" ").slice(1).join(" ") || "",
          email: current_json.email || current_json.applicant_email || "",
          job_title: current_json.job_title || "",
        };
        const oldApplicant = await Applicant.findOne({
          email: applicant_json.email,
        });
        if (oldApplicant)
          return res.status(401).json({
            data_error: `User with email ${applicant_json.email} is already registered for this job`,
          });
        const applicant = new Applicant(applicant_json);
        applicant.save();
      }
      return res
        .status(201)
        .json({ success: "Applicant successfully registered" });
    }

    let files;
    let pdf_resume_zip: Express.Multer.File;
    let applicants_spreadsheet: Express.Multer.File;
    const normalizeHeader = (s: string) => {
      s.trim().toLowerCase().replace(/\s+/g, " ").replace(/_/g, " ");
    };
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

    if (req.files) {
      files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!fieldnames) {
        throw new Error("Could not parse uploaded files");
      }
      let spread_fieldName = fieldnames[0];
      let pdf_fieldName = fieldnames[1];
      if (!spread_fieldName || !pdf_fieldName) {
        throw new Error("Could not parse uploaded files");
      }
      const pdf_array = files[pdf_fieldName];
      const spreadsheet_array = files[spread_fieldName];
      if (!pdf_array || !spreadsheet_array) {
        throw new Error("Could not parse uploaded files");
      }
      if (!pdf_array[0] || !spreadsheet_array[0]) {
        throw new Error("Could not correctly parse uploaded files");
      }
      pdf_resume_zip = pdf_array?.[0];
      applicants_spreadsheet = spreadsheet_array?.[0];

      const allowedMimes: string[] = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      if (!applicants_spreadsheet || !pdf_resume_zip) {
        throw new Error("Could not parse uploaded files");
      },
      const isAllowedType: boolean = allowedMimes.includes(
        applicants_spreadsheet.mimetype,
      );

      const isAllowedExt: boolean =
        applicants_spreadsheet.filename.endsWith(".csv") ||
        applicants_spreadsheet.filename.endsWith(".xlsx");
      if (!isAllowedExt || !isAllowedType) {
        return res.status(400).json({ data_error: "File type not allowed" });
      }

      const workbook = new excel.Workbook();
      let worksheet;
      const file_content_json: any[] = [];
      const rowData: { [key: string]: any } = {};
      let headers: string[] = [];
      if (applicants_spreadsheet.filename.endsWith(".csv")) {
        const stream = Readable.from(applicants_spreadsheet.buffer);
        worksheet = await workbook.csv.read(stream);
        worksheet.eachRow((row, rowNumber) => {
          const rowValues = (row.values as any[])?.slice(1) || undefined;
          if (!rowValues)
            return res.status(400).json({
              data_error: "CSV file does not meet the required structure",
            });
          if (rowNumber === 1) {
            headers = rowValues;
            for (const header of headers) {
              normalizeHeader(header);
            }
          }
          for (let i = 0; i < headers.length; i++) {
            let header = headers[i];
            if (!header) {
              throw new Error("Could not parse uploaded files");
            }
            rowData[header] = rowValues[i];
            file_content_json.push(rowData);
          }
        });
      }
      await workbook.xlsx.load(applicants_spreadsheet.buffer as any);
      worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res.status(500).json({ server_error: "Internal server error" });
      }
      const header_row = worksheet.getRow(1);
      header_row.eachCell({ includeEmpty: false }, (cell) => {
        headers.push(cell.value?.toString() || "");
      });
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
          throw new Error("Could not parse uploaded files");
        }
        const rowData: { [key: string]: any } = {};
        const headerName = headers[rowNumber - 1];
        if (!headerName) {
          throw new Error("Could not parse uploaded files");
        }
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (headers) {
            const index = headers[colNumber - 1];
            if (!index) {
              throw new Error("Could not parse uploaded files");
            }
            rowData[index] = cell.value?.toString();
            file_content_json.push(rowData);
          }
        });
      });
      let resume_array: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < file_content_json.length; i++) {
        const current_json: any = file_content_json[i];
        if (!current_json)
          return res.status(400).json({
            data_error: "Spreadsheet does not match required structure",
          });
        let applicant_json: Applicant_ = {
          first_name: current_json.first_name || current_json["first name"] || current_json.applicant_name?.split(" ")[0] || "",
          last_name: current_json.last_name || current_json["last name"] || current_json.applicant_name?.split(" ").slice(1).join(" ") || "",
          email: current_json.email || current_json.applicant_email || current_json["email address"] || "",
          job_title: current_json.job_title || current_json["job title"] || "",
        };
        const oldApplicant = await Applicant.findOne({
          email: applicant_json.email,
        });
        if (oldApplicant)
          return res.status(401).json({
            data_error: `User with email ${applicant_json.email} is already registered for this job`,
          });
        const applicant = new Applicant(applicant_json);
        const directory = await unzipper.Open.buffer(pdf_resume_zip.buffer);
        const cloud_name: string = env?.CLOUDINARY_API_NAME || "";
        const api_key: string = env?.CLOUDINARY_API_KEY || "";
        const api_secret: string = env?.CLOUDINARY_API_SECRET || "";
        await applicant.save();

        if (env) {
          cloudinary.config({
            cloud_name,
            api_key,
            api_secret,
          });
        }
        for (const entry of directory.files) {
          const applicant_file_name = entry.path.split(".")[0];
          let applicant;
          if (applicant_file_name) {
            applicant = await Applicant.findOne({ email: applicant_file_name });
            if (!applicant) {
               const parts = applicant_file_name.split(" ");
               if (parts.length >= 2) {
                 applicant = await Applicant.findOne({
                   first_name: parts[0] as string,
                   last_name: parts.slice(1).join(" "),
                 });
               }
            }
          }

          if (!applicant) {
            return res.status(400).json({
              data_error: `No matching name in the database for applicant ${applicant_file_name}`,
            });
          }
          let applicant_id = applicant._id;
          let job_title = applicant._id;
          if (!applicant_id) {
            throw new Error("Could not parse uploaded files");
          }
          const result: UploadApiResponse =
            await new Promise<UploadApiResponse>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: "resumes",
                  resource_type: "auto",
                },
                (error, result_) => {
                  if (error) {
                    reject(error);
                  }
                  if (result_) {
                    resolve(result_);
                  }
                },
              );
              entry.stream().pipe(stream);
            });
          const file_url: string = result.secure_url;
          const resume = new Resume({
            applicant_id,
            job_title,
            resume_pdf_url: file_url,
          });
          await resume.save();
          const id = resume._id;
          resume_array.push(id);
          controlDebug("Pdf successfully uploaded");
        }

        for (let i = 0; i < resume_array.length; i++) {
          const resume_id = resume_array[i];
          const resume = await Resume.findOne({ resume_id });
          if (!resume) {
            throw new Error("Could not parse uploaded file");
          }

          let applicant_id = resume.applicant_id;
          const applicant = await Applicant.findOne({ _id: applicant_id });
          if (!applicant) {
            throw new Error("Could not parse uploaded file");
          }

          const url = resume.resume_pdf_url;
          if (!url) {
            throw new Error("Could not parse uploaded file");
          }

          const response = await axios.get(url, {
            responseType: "arraybuffer",
          });
          const pdfData = new Uint8Array(response.data);
          const loadingTask = pdfLib.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;

          const pages = pdf.numPages;
          let fullResumeText = "";

          for (let page_n = 1; page_n <= pages; page_n++) {
            const page = await pdf.getPage(page_n);
            const text: any = await page.getTextContent();
            const pageText = text.items.map((item: any) => item.str).join(" ");
            fullResumeText += pageText + "\\n";
          }
          
          try {
            const genAI = new GoogleGenerativeAI(env?.GOOGLE_API_KEY || "");
            const model = genAI.getGenerativeModel({
              model: env?.GOOGLE_AI_MODEL || "gemini-1.5-flash",
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: SchemaType.OBJECT,
                  properties: {
                    skills: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, level: { type: SchemaType.STRING }, years_of_experience: { type: SchemaType.NUMBER } } } },
                    language: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, proficiency: { type: SchemaType.STRING } } } },
                    experience: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { company: { type: SchemaType.STRING }, role: { type: SchemaType.STRING }, start_date: { type: SchemaType.STRING }, end_date: { type: SchemaType.STRING }, technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }, is_current: { type: SchemaType.BOOLEAN } } } },
                    education: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { institution: { type: SchemaType.STRING }, degree: { type: SchemaType.STRING }, field_of_study: { type: SchemaType.STRING }, start_year: { type: SchemaType.NUMBER }, end_year: { type: SchemaType.NUMBER } } } },
                    certifications: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, issuer: { type: SchemaType.STRING }, issuer_date: { type: SchemaType.STRING } } } },
                    projects: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, description: { type: SchemaType.STRING }, technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }, role: { type: SchemaType.STRING }, link: { type: SchemaType.STRING }, start_date: { type: SchemaType.STRING }, end_date: { type: SchemaType.STRING } } } },
                    availability: { type: SchemaType.OBJECT, properties: { status: { type: SchemaType.STRING }, type: { type: SchemaType.STRING }, start_date: { type: SchemaType.STRING } } },
                    social_links: { type: SchemaType.OBJECT, properties: { linked_in: { type: SchemaType.STRING }, github: { type: SchemaType.STRING }, portfolio: { type: SchemaType.STRING } } }
                  }
                }
              }
            });
            const prompt = `Extract the structured information from the following resume text. Do your best to map the text to the schema fields. Text:
${fullResumeText}`;
            const aiResult = await model.generateContent(prompt);
            const aiResponse = aiResult.response.text();
            const parsedData = JSON.parse(aiResponse);
            
            const updateApplic = await Applicant.findOneAndUpdate(
              { _id: applicant_id },
              {
                $set: {
                  skills: parsedData.skills,
                  language: parsedData.language,
                  experience: parsedData.experience,
                  education: parsedData.education,
                  certifications: parsedData.certifications,
                  projects: parsedData.projects,
                  availability: parsedData.availability,
                  social_links: parsedData.social_links
                }
              }
            );
            if (updateApplic) {
              await updateApplic.save();
            }
          } catch(err) {
            controlDebug("Error parsing PDF with AI: " + err);
          }
        }
        res.status(201).json({
          success: "Applicants successfully registered from spreadsheet file",
        });
      }
    }
  } catch (error) {
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default applicantControl;
