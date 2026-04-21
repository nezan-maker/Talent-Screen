import mongoose from "mongoose";
const resumeSchema = new mongoose.Schema({
    job_title: {
        type: String,
        required: true,
    },
    applicant_id: {
        type: String,
        required: true,
    },
    resume_pdf_url: {
        type: String,
        required: true,
    },
});
const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
//# sourceMappingURL=Resume.js.map