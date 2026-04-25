import mongoose, { Schema } from "mongoose";
import { buildEntityId } from "../utils/ids.js";

<<<<<<< HEAD
<<<<<<< HEAD
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
    job_title: {
      type: String,
      required: true,
      index: true,
=======
const jobSchema = new mongoose.Schema(
  {
    job_title: {
      type: String,
      required: true,
>>>>>>> fbe6478 (Refined the shortlisting emails for shortlisted and rejected)
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

=======
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
  job_requirements: {
    type: [String],
    default: [],
  },
  job_skills: {
    type: [String],
    default: [],
  },
  company_name: {
    type: String,
  },
  job_experience: {
    type: Number,
    required: true,
  },
  job_qualifications: {
    type: [String],
    required: true,
  },
  workers_required: {
    type: Number,
    required: true,
  },
  job_notes: {
    type: [String],
  },
});
>>>>>>> a0dac98 (Refined the screening ai service)
=======
    job_requirements: {
      type: [String],
      default: [],
    },
    job_skills: {
      type: [String],
      default: [],
    },
    company_name: {
      type: String,
    },
    job_experience: {
      type: Number,
      required: true,
    },
    job_qualifications: {
      type: [String],
      required: true,
    },
    workers_required: {
      type: Number,
      required: true,
    },
    job_notes: {
      type: [String],
    },
    selected_applicant_deadline: {
      type: Date,
    },
  },
  { timestamps: true },
);
>>>>>>> fbe6478 (Refined the shortlisting emails for shortlisted and rejected)
const Job = mongoose.model("Job", jobSchema);

export default Job;
