import Job from "../models/Job.js";
import { controlDebug } from "./authControl.js";
import env from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JobSchema } from "../validations/functionValidations.js";
const completeJob = async (req, res) => {
    try {
        const { reqString } = req.body;
        const reqBody = JSON.parse(reqString);
        const z_parse_result = JobSchema.parse(reqBody);
        const access_token = req.cookies.reference_token;
        if (!access_token) {
            throw new Error("Could not find user_details cookie missing or expired");
        }
        if (!env.ACCESS_SECRET) {
            throw new Error("Access token environment variable could not be found");
        }
        if (!reqBody)
            return res.status(400).json({ data_error: "Incorrect job structure" });
        const oldJob = await Job.findOne({ job_title: reqBody.job_title });
        if (oldJob)
            return res.status(401).json({ message: "Job already registered" });
        let payload = jwt.verify(access_token, env.ACCESS_SECRET);
        let user_id = payload.userId;
        if (!user_id) {
            throw new Error("Could not find user details");
        }
        const user = await User.findOne({ _id: user_id });
        if (!user) {
            throw new Error("Could not find user details");
        }
        let company_name = user.company_name;
        const job = new Job(z_parse_result);
        job.company_name = company_name;
        await job.save();
        res.status(201).json({ success: "Job successfully created" });
    }
    catch (error) {
        controlDebug("Error in complete job controller");
        console.error(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default completeJob;
//# sourceMappingURL=completeJob.js.map