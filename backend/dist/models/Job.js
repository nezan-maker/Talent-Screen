<<<<<<< HEAD
import mongoose, { Schema } from "mongoose";
import { buildEntityId } from "../utils/ids.js";
const criterionSchema = new Schema({
    criteria_string: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, default: "medium" },
}, { _id: false });
const exampleFormSchema = new Schema({
    ROLE_TITLE: { type: String, default: "" },
    EXPERIENCE_LEVEL: { type: String, default: "" },
    CORE_STRENGTHS: { type: [String], default: [] },
}, { _id: false });
=======
import mongoose from "mongoose";
>>>>>>> 5ba2726 (Prepared for ultimate debug session)
const jobSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => buildEntityId("job"),
    },
    job_title: {
        type: String,
        required: true,
        index: true,
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
<<<<<<< HEAD
=======
    job_requirements: {
        type: [String],
        default: [],
    },
    job_skills: {
        type: [String],
        default: [],
    },
>>>>>>> 5ba2726 (Prepared for ultimate debug session)
    company_name: {
        type: String,
        default: "Independent Recruiter",
    },
<<<<<<< HEAD
    job_experience_required: {
        type: String,
        default: "Not specified",
    },
    job_description: {
        type: String,
        default: "",
    },
    job_responsibilities: {
        type: String,
        default: "",
    },
    job_qualifications: {
        type: String,
        default: "",
=======
    job_experience: {
        type: Number,
        required: true,
    },
    job_qualifications: {
        type: [String],
        required: true,
>>>>>>> 5ba2726 (Prepared for ultimate debug session)
    },
    job_ai_criteria: {
        type: [criterionSchema],
        default: [],
    },
    job_shortlist_size: {
        type: Number,
        enum: [10, 20],
        default: 10,
    },
<<<<<<< HEAD
    job_state: {
        type: String,
        enum: ["Draft", "Active", "Screening", "Complete"],
        default: "Draft",
        index: true,
    },
    job_salary_min: {
        type: Number,
        default: null,
    },
    job_salary_max: {
        type: Number,
        default: null,
    },
    workers_required: {
        type: Number,
        default: 1,
    },
    job_example_form: {
        type: exampleFormSchema,
        default: () => ({
            ROLE_TITLE: "",
            EXPERIENCE_LEVEL: "",
            CORE_STRENGTHS: [],
        }),
=======
    job_notes: {
        type: [String],
>>>>>>> 5ba2726 (Prepared for ultimate debug session)
    },
}, { timestamps: true });
const Job = mongoose.model("Job", jobSchema);
export default Job;
//# sourceMappingURL=Job.js.map