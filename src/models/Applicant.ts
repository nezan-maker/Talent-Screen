import mongoose from "mongoose";
import { required } from "zod/mini";
const skillSchema = new mongoose.Schema({
  skill_name: {
    type: String,
    required: true,
  },
  skill_category: {
    type: String,
    reqiured: true,
  },
  skill_description: {
    type: String,
    required: true,
  },
  education_level_certificates: {
    type: [String],
    required: true,
  },
  proficiency_level: {
    type: Number,
  },
});

const applicantSchema = new mongoose.Schema({
  applicant_name: {
    type: String,
    required: true,
  },
  job_title: {
    type: String,
    required: true,
  },
  skills: skillSchema,

  experience_years: {
    type: Number,
    required: true,
  },
  screening_state: {
    type: String,
    required: true,
    default: "Uninitialised",
  },
});
const Applicant = mongoose.model("applicants", applicantSchema);
export default Applicant;
