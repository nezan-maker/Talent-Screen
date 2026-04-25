import mongoose, { Schema } from "mongoose";
import { buildEntityId } from "../utils/ids.js";
const skillSchema = new Schema({
    name: { type: String, required: true },
    level: { type: String, default: "Intermediate" },
    yearsOfExperience: { type: Number, default: 0 },
}, { _id: false });
const languageSchema = new Schema({
    name: { type: String, required: true },
    proficiency: { type: String, default: "Conversational" },
}, { _id: false });
const experienceSchema = new Schema({
    company: { type: String, default: "" },
    role: { type: String, default: "" },
    start_date: { type: String, default: "" },
    end_date: { type: String, default: "" },
    description: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    is_current: { type: Boolean, default: false },
}, { _id: false });
const educationSchema = new Schema({
    institution: { type: String, default: "" },
    degree: { type: String, default: "" },
    field_of_study: { type: String, default: "" },
    start_year: { type: Number, default: null },
    end_year: { type: Number, default: null },
}, { _id: false });
const certificationSchema = new Schema({
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    issue_date: { type: String, default: "" },
}, { _id: false });
const projectSchema = new Schema({
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    role: { type: String, default: "" },
    link: { type: String, default: "" },
    start_date: { type: String, default: "" },
    end_date: { type: String, default: "" },
}, { _id: false });
const availabilitySchema = new Schema({
    status: { type: String, default: "Open to Opportunities" },
    type: { type: String, default: "Full-time" },
    start_date: { type: String, default: null },
}, { _id: false });
const socialLinksSchema = new Schema({
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
}, { _id: false });
const applicantSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => buildEntityId("cand"),
    },
    first_name: {
        type: String,
        required: true,
        description: "Talent's first name",
    },
    last_name: {
        type: String,
        required: true,
        description: "Talent's last name",
    },
    applicant_name: {
        type: String,
        required: true,
        index: true,
        description: "Convenience full name field for recruiter workflows",
    },
    email: {
        type: String,
        required: true,
        index: true,
        description: "Unique email address for the profile",
    },
    applicant_email: {
        type: String,
        required: true,
        index: true,
        description: "Frontend compatibility alias for the profile email",
    },
    headline: {
        type: String,
        required: true,
        description: "Short professional summary",
    },
    bio: {
        type: String,
        default: "",
        description: "Detailed professional biography",
    },
    location: {
        type: String,
        required: true,
        description: "Current location (City, Country)",
    },
    job_id: {
        type: String,
        ref: "Job",
        index: true,
        default: null,
    },
    job_title: {
        type: String,
        required: true,
        index: true,
    },
    skills: {
        type: [skillSchema],
        default: [],
        description: "List of skills with proficiency",
    },
    languages: {
        type: [languageSchema],
        default: [],
        description: "Spoken languages",
    },
    experience: {
        type: [experienceSchema],
        default: [],
        description: "Professional experience history",
    },
    education: {
        type: [educationSchema],
        default: [],
        description: "Academic background",
    },
    certifications: {
        type: [certificationSchema],
        default: [],
        description: "Professional certifications",
    },
    projects: {
        type: [projectSchema],
        default: [],
        description: "Portfolio projects",
    },
    availability: {
        type: availabilitySchema,
        default: () => ({
            status: "Open to Opportunities",
            type: "Full-time",
            start_date: null,
        }),
        description: "Talent availability",
    },
    social_links: {
        type: socialLinksSchema,
        default: () => ({}),
        description: "External profiles",
    },
    additional_info: {
        type: [String],
        default: [],
    },
    resume_text: {
        type: String,
        default: "",
    },
    source: {
        type: String,
        enum: ["seed", "manual", "upload", "platform", "external"],
        default: "manual",
    },
    applicant_state: {
        type: String,
        enum: ["Queued", "In Review", "Shortlisted", "Rejected"],
        default: "In Review",
        index: true,
    },
    shortlisted: {
        type: Boolean,
        default: false,
        index: true,
    },
}, { timestamps: true });
applicantSchema.index({ job_id: 1, applicant_email: 1 }, { unique: false });
applicantSchema.index({ job_title: 1, applicant_name: 1 }, { unique: false });
const Applicant = mongoose.model("Applicant", applicantSchema);
export default Applicant;
//# sourceMappingURL=Applicant.js.map