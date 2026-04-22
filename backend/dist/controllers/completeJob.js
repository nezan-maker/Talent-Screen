import Job from "../models/Job.js";
import askGemini from "../services/aiservice.js";
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
        const sample_job = await Job.findOne({ _id: job._id });
        if (!sample_job) {
            return res.status(500).json({ server_error: "Internal server error" });
        }
        let guidelines = "You are to create  an example resume that addresses all the job details that will be presented to the user as a reference to ensure all needed info are given.P.S the values of main properties must be in capital letters and the response you give me back must be a json stringified string I will pass into an object that I will store in the database";
        let prompt_object = { sample_job, guidelines };
        let prompt = JSON.stringify(prompt_object);
        let result = await askGemini(prompt);
        if (result.startsWith("```json")) {
            result = result.replace("/```json|```/g", "");
        }
        job.job_example_form = result;
        await job.save();
    }
    catch (error) {
        controlDebug(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default completeJob;
//# sourceMappingURL=completeJob.js.map