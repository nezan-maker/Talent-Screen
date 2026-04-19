import Job from "../models/Job.js";
import { controlDebug } from "./authControl.js";
const completeJob = async (req, res) => {
    try {
        const { reqBody } = req.body;
        if (!reqBody)
            return res.status(400).json({ data_error: "Incorrect job structure" });
        const oldJob = await Job.findOne({ job_title: reqBody.job_title });
        if (oldJob)
            return res.status(401).json({ message: "Job already registered" });
        const job = new Job(reqBody);
        await job.save();
    }
    catch (error) {
        controlDebug(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default completeJob;
//# sourceMappingURL=completeJob.js.map