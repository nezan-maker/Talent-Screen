import mongoose from "mongoose";
const applicantSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      description: "Talent 's first name",
    },
    last_name: {
      type: String,
      required: true,
      description: "Talent 's last name",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      description: "Unique email address",
    },
    headline: {
      type: String,
      description: "Short professional summary",
    },
    bio: {
      type: String,
      required: true,
      description: "Detailed professional biography",
    },
    location: {
      type: String,
      required: true,
      description: "Current location(City,Country)",
    },
    skills: {
      type: [Object],
      required: true,
      descrption: "List of skills with proficiency",
    },
    language: {
      type: [Object],
      description: "Spoken languages",
    },
    experience: {
      type: [Object],
      required: true,
      description: "Professional experience history",
    },
    education: {
      type: [Object],
      requied: true,
      description: "Academic background",
    },
    certifications: {
      type: [Object],
      description: "Professional certifications",
    },
    projects: {
      type: [Object],
      description: "Portfolio projects",
    },
    availability: {
      type: Object,
      description: "Talent Availability",
    },
    social_links: {
      type: Object,
      description: "External profiles",
    },
    job_title: {
      type: String,
      required: true,
    },
    applicant_state: {
      type: String,
      default: "Queued",
    },
  },
  { timestamps: true },
);
const Applicant = mongoose.model("applicants", applicantSchema);
export default Applicant;
