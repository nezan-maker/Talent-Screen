import mongoose from "mongoose";
import { buildEntityId } from "../utils/ids.js";

const resumeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => buildEntityId("resume"),
    },
    job_id: {
      type: String,
      ref: "Job",
      default: null,
      index: true,
    },
    job_title: {
      type: String,
      required: true,
    },
    applicant_id: {
      type: String,
      ref: "Applicant",
      required: true,
      index: true,
    },
    resume_pdf_url: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      default: "",
    },
    parsed_text: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
