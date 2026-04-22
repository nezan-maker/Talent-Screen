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
    }
    catch (error) {
        controlDebug(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default resumeUpload;
//# sourceMappingURL=resumeUpload.js.map