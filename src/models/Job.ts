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
    default: null,
  },
  job_salary_min: {
    type: Boolean,
    default: false,
  },
  job_salary_max: {
    type: Number,
  },
  job_experience_level: {
    type: String,
    required: true,
  },
  job_ai_description: {
    type: Array,
  },
});
const Job = mongoose.model("User", jobSchema);
export default Job;
