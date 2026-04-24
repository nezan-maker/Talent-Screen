import mongoose from "mongoose";

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
const Job = mongoose.model("Job", jobSchema);
export default Job;
