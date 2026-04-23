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
  company_name: {
    type: String,
  },
  job_experience_required: {
    type: String,
    required: true,
  },
  job_description: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  job_ai_criteria: [ai_criteria],
  job_shortlist_size: {
    type: Number,
    default: 10,
  },
  job_responsibilities: {
    type: String,
    required: true,
  },
  job_qualifications: {
    type: String,
    required: true,
  },
  workers_required: {
    type: Number,
    required: true,
  },
  job_state: {
    type: String,
    default: "Uninitialised",
  },
  job_example_form: {
    type: Object,
  },
},
{ timestamps: true });

const Job = mongoose.model("Job", jobSchema);
export default Job;
