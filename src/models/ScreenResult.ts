import mongoose from "mongoose";
type Applicant_result = {
  applicant_id: string;
  applicant_marks: number;
};
const applicant_schema = new mongoose.Schema({
  applicant_id: {
    type: String,
    required: true,
  },
  applicant_name: {
    type: String,
    required: true,
  },
  applicant_marks: {
    type: Number,
    required: true,
  },
  applicant_result_description: {
    type: String,
    required: true,
  },
});
const resultSchema = new mongoose.Schema({
  job_title: {
    type: String,
    required: true,
  },
  applicants_details: [applicant_schema],
  result_verdict: {
    type: String,
    required: true,
  },
});

const Result = mongoose.model("screening_results", resultSchema);

export default Result;
