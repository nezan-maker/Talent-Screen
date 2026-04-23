import nodemailer from "nodemailer";
import Applicant from "../models/Applicant.js";
const emailingController = async (req, res) => {
    const { job_title } = req.body;
    if (!job_title) {
        return res.status(400).json({ data_error: "No job name provided" });
    }
    const shortlisted_applicants = await Applicant.find({
        shortlisted: true,
        job_title,
    });
    if (!shortlisted_applicants) {
        return res
            .status(400)
            .json({ data_error: "No shortlisted appplicants for this job yet " });
    }
    for (let appL_index = 0; appL_index < shortlisted_applicants.length; appL_index++) {
        let current_json = shortlisted_applicants[appL_index];
        if (!current_json) {
            throw new Error("Could not get applicant email ");
        }
        let sendEmail = current_json.applicant_email;
    }
};
//# sourceMappingURL=shortListEmails.js.map