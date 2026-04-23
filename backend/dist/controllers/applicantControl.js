import * as excel from "exceljs";
import Applicant from "../models/Applicant.js";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";
import unzipper from "unzipper";
import env from "../config/env.js";
import mongoose from "mongoose";
import axios from "axios";
import * as pdfLib from "pdfjs-dist/legacy/build/pdf.mjs";
import Resume from "../models/Resume.js";
import { fieldnames } from "../routes/dashRoutes.js";
import { controlDebug } from "./authControl.js";
const applicantControl = async (req, res) => {
    try {
        if (!req.files) {
            if (!req.body)
                return res
                    .status(400)
                    .json({ data_error: "Info about the applicants required" });
            const { raw_application_data } = req.body;
            const application_data = JSON.parse(raw_application_data);
            for (let i = 0; i < application_data.length; i++) {
                const current_json = application_data[i];
                let applicant_json = {
                    applicant_name: current_json.applicant_name,
                    job_title: current_json.job_title,
                    applicant_email: current_json.applicant_email,
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
        let files;
        let pdf_resume_zip;
        let applicants_spreadsheet;
        if (req.files) {
            files = req.files;
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
            const allowedMimes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/csv",
            ];
            if (!applicants_spreadsheet || !pdf_resume_zip) {
                throw new Error("Could not parse uploaded files");
            }
            const isAllowedType = allowedMimes.includes(applicants_spreadsheet.mimetype);
            const isAllowedExt = applicants_spreadsheet.filename.endsWith(".csv") ||
                applicants_spreadsheet.filename.endsWith(".xlsx");
            if (!isAllowedExt || !isAllowedType) {
                return res.status(400).json({ data_error: "File type not allowed" });
            }
            const workbook = new excel.Workbook();
            let worksheet;
            const file_content_json = [];
            const rowData = {};
            let headers = [];
            if (applicants_spreadsheet.filename.endsWith(".csv")) {
                const stream = Readable.from(applicants_spreadsheet.buffer);
                worksheet = await workbook.csv.read(stream);
                worksheet.eachRow((row, rowNumber) => {
                    const rowValues = row.values?.slice(1) || undefined;
                    if (!rowValues)
                        return res.status(400).json({
                            data_error: "CSV file does not meet the required structure",
                        });
                    if (rowNumber === 1) {
                        headers = rowValues;
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
            await workbook.xlsx.load(applicants_spreadsheet.buffer);
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
                const rowData = {};
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
            let resume_array = [];
            for (let i = 0; i < file_content_json.length; i++) {
                const current_json = file_content_json[i];
                if (!current_json)
                    return res.status(400).json({
                        data_error: "Spreadsheet does not match required structure",
                    });
                let applicant_json = {
                    applicant_name: current_json.applicant_name,
                    applicant_email: current_json.applicant_email,
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
                const directory = await unzipper.Open.buffer(pdf_resume_zip.buffer);
                const cloud_name = env?.CLOUDINARY_API_NAME || "";
                const api_key = env?.CLOUDINARY_API_KEY || "";
                const api_secret = env?.CLOUDINARY_API_SECRET || "";
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
                        applicant = await Applicant.findOne({
                            applicant_name: applicant_file_name,
                        });
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
                    const result = await new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream({
                            folder: "resumes",
                            resource_type: "auto",
                        }, (error, result_) => {
                            if (error) {
                                reject(error);
                            }
                            if (result_) {
                                resolve(result_);
                            }
                        });
                        entry.stream().pipe(stream);
                    });
                    const file_url = result.secure_url;
                    const resume = new Resume({
                        applicant_id,
                        job_title,
                        resume_pdf_url: file_url,
                    });
                    await resume.save();
                    resume_array.push(resume._id);
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
                    const fontSizes = [];
                    const selected_headers = [];
                    for (let page_n = 1; page_n <= pages; page_n++) {
                        const page = await pdf.getPage(page_n);
                        const text = await page.getTextContent();
                        text.items.forEach((item) => {
                            let isUpper = item.str === item.str.toUpperCase();
                            if (isUpper) {
                                fontSizes.push(item.height);
                                selected_headers.push(item.str);
                            }
                        });
                        let headers = [
                            "SKILLS",
                            "EDUCATION",
                            "EXPERIENCE",
                            "ADDITIONAL INFORMATION",
                        ];
                        if (headers) {
                            let database_headers = headers.map((header) => header.toLowerCase() || "");
                            if (database_headers) {
                                let add_info = database_headers?.[3] ?? "";
                                let temp_info_header_array = add_info.split(" ");
                                database_headers[3] =
                                    temp_info_header_array[0] + "_" + temp_info_header_array[1];
                            }
                        }
                        let header_text;
                        let header_array = [];
                        let skill_obj = {};
                        let educ_obj = {};
                        let exp_obj = {};
                        let add_obj = {};
                        for (let head = 0; head < selected_headers.length; head++) {
                            const current_header = selected_headers[head] || "";
                            let pattern;
                            let real_head = 0;
                            if (headers.includes(current_header)) {
                                pattern = new RegExp(`${selected_headers[head]}(*?)${selected_headers[head + 1]}`);
                                const strings = text.items.map((item) => item.str);
                                const fullText = strings.join(" ").trim();
                                header_text = fullText.match(pattern);
                                const headerObject = {};
                                headerObject[real_head] = header_text;
                                header_array.push(headerObject);
                                real_head++;
                            }
                            else {
                                continue;
                            }
                            if (header_array[0] &&
                                header_array[1] &&
                                header_array[2] &&
                                header_array[3]) {
                                skill_obj = header_array[0];
                                educ_obj = header_array[1];
                                exp_obj = header_array[2];
                                add_obj = header_array[3];
                            }
                            const updateApplic = await Applicant.findOneAndUpdate({
                                _id: applicant_id,
                            }, {
                                skills: skill_obj.skills,
                                education: educ_obj.education,
                                experience: exp_obj.education,
                                additional_info: add_obj.additional_information,
                            });
                            if (updateApplic) {
                                await updateApplic.save();
                            }
                            else {
                                throw new Error("Could not parse uploaded file");
                            }
                        }
                    }
                }
                res.status(200).json({
                    success: "Applicants successfully registered from spreadsheet file",
                });
            }
        }
    }
    catch (error) {
        controlDebug(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default applicantControl;
//# sourceMappingURL=applicantControl.js.map