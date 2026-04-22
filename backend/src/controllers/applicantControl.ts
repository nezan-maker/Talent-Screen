import type { Response, Request } from "express";
import * as excel from "exceljs";
import Applicant from "../models/Applicant.js";
import { Readable } from "stream";
interface Applicant_ {
  applicant_name: string;
  job_title: string;
}
const applicantControl = async (req: Request, res: Response) => {
  if (!req.file) {
    if (!req.body)
      return res
        .status(400)
        .json({ data_error: "Info about the applicants required" });
    const { raw_application_data }: { raw_application_data: string } = req.body;
    const application_data = JSON.parse(raw_application_data);
    for (let i = 0; i < application_data.length; i++) {
      const current_json: Applicant_ = application_data[i];

      let applicant_json: Applicant_ = {
        applicant_name: current_json.applicant_name,
        job_title: current_json.job_title,
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
    return res
      .status(401)
      .json({ success: "Applicant successfully registered" });
  }
  const file: Express.Multer.File = req.file;
  const allowedMimes: string[] = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ];
  const isAllowedType: boolean = allowedMimes.includes(file.mimetype);
  const isAllowedExt: boolean =
    file.filename.endsWith(".csv") || file.filename.endsWith(".xlsx");
  if (!isAllowedExt || !isAllowedType) {
    return res.status(400).json({ data_error: "File type not allowed" });
  }

  const workbook = new excel.Workbook();
  let worksheet;
  const file_content_json: any[] = [];
  const rowData: { [key: string]: any } = {};
  let headers: string[] = [];
  if (file.filename.endsWith(".csv")) {
    const stream = Readable.from(file.buffer);
    worksheet = await workbook.csv.read(stream);
    worksheet.eachRow((row, rowNumber) => {
      const rowValues = (row.values as any[])?.slice(1) || undefined;
      if (!rowValues)
        return res.status(400).json({
          data_error: "CSV file does not meet the required structure",
        });
      if (rowNumber === 1) {
        headers = rowValues;
      }
      for (let i = 0; i < headers.length; i++) {
        let header = headers[i];
        if (!header) return;
        rowData[header] = rowValues[i];
        file_content_json.push(rowData);
      }
    });
  }
  await workbook.xlsx.load(file.buffer as any);
  worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return res.status(500).json({ server_error: "Internal server error" });
  }
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
    const current_json: Applicant_ = file_content_json[i];
    if (!current_json)
      return res
        .status(400)
        .json({ data_error: "Spreadsheet does not match required structure" });
    let applicant_json: Applicant_ = {
      applicant_name: current_json.applicant_name,
      job_title: current_json.job_title,
    };
    const oldApplicant = await Applicant.findOne({
      applicant_name: current_json.applicant_name,
    });
    if (oldApplicant)
      return res.status(401).json({
        data_error: `User named ${current_json.applicant_name} is already registered for this job`,
      });
    const applicant = new Applicant(applicant_json);
    await applicant.save();
    res
      .status(200)
      .json({ success: "Job successfully created from spreadsheet file" });
  }
};
export default applicantControl;
