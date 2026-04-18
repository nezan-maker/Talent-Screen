import mongoose from "mongoose";
const applicantSchema = new mongoose.Schema({
    applicant_name: {
        type: String,
        required: true,
    },
    job_title: {
        type: String,
        required: true,
    },
    skills: {
        type: [String],
        required: true,
    },
    education_certifates: {
        type: [String],
        required: true,
    },
    additional_info: {
        type: [String],
        required: true,
    },
    experience_in_years: {
        type: Number,
        required: true,
    },
    screening_state: {
        type: String,
        default: "Uninitialised",
    },
});
const Applicant = mongoose.model("applicants", applicantSchema);
export default Applicant;
//# sourceMappingURL=Applicant.js.map