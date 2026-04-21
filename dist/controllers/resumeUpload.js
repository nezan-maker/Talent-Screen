import { v2 as cloudinary } from "cloudinary";
import { controlDebug } from "./authControl.js";
import unzipper from "unzipper";
import env from "../config/env.js";
import Resume from "../models/Resume.js";
import Applicant from "../models/Applicant.js";
import mongoose from "mongoose";
const resumeUpload = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ data_error: "No valid PDF file uploaded" });
        }
        const zipFile = req.file;
        const directory = await unzipper.Open.buffer(zipFile.buffer);
        const cloud_name = env?.CLOUDINARY_API_NAME || "";
        const api_key = env?.CLOUDINARY_API_KEY || "";
        const api_secret = env?.CLOUDINARY_API_SECRET || "";
        let resume_array = [];
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
                return res.status(500).json({ server_error: "Internal server error" });
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
            req.resume_array = resume_array;
            res.status(200).json({ success: "Successfully uploaded resume PDFs" });
        }
    }
    catch (error) {
        controlDebug(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default resumeUpload;
//# sourceMappingURL=resumeUpload.js.map