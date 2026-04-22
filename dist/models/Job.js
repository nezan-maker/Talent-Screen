import mongoose from "mongoose";
const ai_criteria = new mongoose.Schema({
    criteria_string: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        required: true,
    },
});
const jobSchema = new mongoose.Schema({
    job_title: {
        type: String,
        required: true,
    },
    job_department: {
        type: String,
        required: true,
    },
    job_location: {
        type: String,
        required: true,
    },
    job_employment_type: {
        type: String,
        required: true,
    },
    job_salary_min: {
        type: Number,
    },
    job_salary_max: {
        type: Number,
    },
    job_experience_required: {
        type: String,
        required: true,
    },
    job_ai_criteria: [ai_criteria],
    workers_required: {
        type: Number,
        required: true,
    },
    job_state: {
        type: String,
        default: "Uninitialised",
    },
});
const Job = mongoose.model("Job", jobSchema);
export default Job;
//# sourceMappingURL=Job.js.map