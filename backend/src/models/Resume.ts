import mongoose from "mongoose";
<<<<<<< HEAD
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
=======
const resumeSchema = new mongoose.Schema(
  {
>>>>>>> fbe6478 (Refined the shortlisting emails for shortlisted and rejected)
    job_title: {
      type: String,
      required: true,
    },
    applicant_id: {
<<<<<<< HEAD
      type: String,
      ref: "Applicant",
      required: true,
      index: true,
=======
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
>>>>>>> fbe6478 (Refined the shortlisting emails for shortlisted and rejected)
    },
    resume_pdf_url: {
      type: String,
      required: true,
    },
<<<<<<< HEAD
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

=======
  },
  { timestamps: true },
);
>>>>>>> fbe6478 (Refined the shortlisting emails for shortlisted and rejected)
const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
