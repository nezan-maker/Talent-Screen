import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    applicant_name: {
      type: String,
      required: true,
    },
    applicant_email: {
      type: String,
      required: true,
    },
    job_title: {
      type: String,
      required: true,
    },
    skills: {
      type: String,
    },
    education: {
      type: String,
    },
    experience: {
      type: Number,
    },
    additional_info: {
      type: String,
    },
    shortlisted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Applicant = mongoose.model("applicants", applicantSchema);
export default Applicant;
