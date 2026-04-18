import type { Response, Request } from "express";
import * as excel from "exceljs";
import Applicant from "../models/Applicant.js";
interface ApplicantData {
  applicant_name: string;
  job_title: string;
  skills: string | string[];
  education_certificates: string | string[];
  additional_info: string | string[];
  experience_in_years: number;
}
interface Applicant extends ApplicantData {
  skills: string[];
  education_certificates: string[];
  additional_info: string[];
}
const applicantControl = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ data_error: "No file uploaded" });
  }
  const file: Express.Multer.File = req.file;
  const allowedMimes: string[] = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/ms-excel",
  ];
  const isAllowedType: boolean = allowedMimes.includes(file.mimetype);
  const isAllowedExt: boolean =
    file.filename.endsWith(".csv") ||
    file.filename.endsWith(".xlsx") ||
    file.filename.endsWith(".xls");
  if (!isAllowedExt || !isAllowedType) {
    return res.status(400).json({ data_error: "File type not allowed" });
  }
  const workbook = new excel.Workbook();
  await workbook.xlsx.load(file.buffer as any);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return res.status(500).json({ server_error: "Internal server error" });
  }
  const headers: string[] = [];
  const file_content_json: any[] = [];
  const header_row = worksheet.getRow(1);
  header_row.eachCell({ includeEmpty: false }, (cell) => {
    headers.push(cell.value?.toString() || "");
  });
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: { [key: string]: any } = {};
    const headerName = headers[rowNumber - 1];
    if (!headerName) return;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (headers) {
        const index = headers[colNumber - 1];
        if (!index) return;
        rowData[index] = cell.value?.toString();
        file_content_json.push(rowData);
      }
    });
  });
  for (let i = 0; i < file_content_json.length; i++) {
    const current_json: ApplicantData = file_content_json[i];
    if (
      typeof current_json.skills !== "string" ||
      typeof current_json.additional_info !== "string" ||
      typeof current_json.education_certificates !== "string"
    )
      return;
    let skills = current_json.skills.split(",");
    let additional_info = current_json.skills.split(",");
    let education_certificates = current_json.skills.split(",");
    let applicant_json: Applicant = {
      applicant_name: current_json.applicant_name,
      job_title: current_json.job_title,
      skills,
      additional_info,
      education_certificates,
      experience_in_years: current_json.experience_in_years,
    };
    const oldApplicant = await Applicant.findOne({
      applicant_name: current_json.applicant_name,
    });
    if (oldApplicant)
      return res.status(401).json({
        data_error: `User named ${current_json.applicant_name} is already registered for this job`,
      });
    const applicant = new Applicant(applicant_json);
    applicant.save();
  }
};
export default applicantControl;
