import mongoose, { Schema } from "mongoose";
import { buildEntityId } from "../utils/ids.js";
const criterionSchema = new Schema(
  {
    criteria_string: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, default: "medium" },
  },
  { _id: false },
);

const exampleFormSchema = new Schema(
  {
    ROLE_TITLE: { type: String, default: "" },
    EXPERIENCE_LEVEL: { type: String, default: "" },
    CORE_STRENGTHS: { type: [String], default: [] },
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => buildEntityId("job"),
    },
    user_id: {
      type: String,
      ref: "User",
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
    company_name: {
      type: String,
      default: "Independent Recruiter",
    },
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
    minimum_marks: {
      type: Number,
      required: true,
      default: 70,
    },
    job_example_form: {
      type: exampleFormSchema,
      default: () => ({
        ROLE_TITLE: "",
        EXPERIENCE_LEVEL: "",
        CORE_STRENGTHS: [],
      }),
    },
  },
  { timestamps: true },
);
const Job = mongoose.model("Job", jobSchema);

export default Job;
