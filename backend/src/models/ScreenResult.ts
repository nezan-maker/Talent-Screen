import { Schema, model } from "mongoose";
import { buildEntityId } from "../utils/ids.js";

const scoreWithReasoningSchema = new Schema(
  {
    score: { type: Number, required: true },
    reasoning: { type: String, default: "" },
  },
  { _id: false },
);

const ScreeningResultSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => buildEntityId("result"),
    },
    screening_id: {
      type: String,
      required: true,
      default: () => buildEntityId("screening"),
    },
    screening_run_id: {
      type: String,
      ref: "ScreeningRun",
      required: true,
      index: true,
    },
    candidate_id: {
      type: String,
      ref: "Applicant",
      required: true,
      index: true,
    },
    applicant_id: {
      type: String,
      ref: "Applicant",
      required: true,
      index: true,
    },
    job_id: { type: String, ref: "Job", required: true, index: true },
    evaluated_at: { type: Date, required: true },
    overall: {
      score: { type: Number, required: true },
      grade: { type: String, required: true },
      verdict: {
        type: String,
        enum: ["Shortlisted", "Review", "Rejected"],
        required: true,
      },
      summary: { type: String, required: true },
    },
    dimension_scores: {
      skills_match: {
        ...scoreWithReasoningSchema.obj,
        matched: { type: [String], default: [] },
        missing: { type: [String], default: [] },
      },
      experience_relevance: {
        ...scoreWithReasoningSchema.obj,
        total_years: { type: Number, default: 0 },
        relevant_years: { type: Number, default: 0 },
        highlights: { type: [String], default: [] },
      },
      education_fit: {
        ...scoreWithReasoningSchema.obj,
        degree_level: { type: String, default: "" },
        field_relevance: { type: String, default: "" },
      },
      project_quality: {
        ...scoreWithReasoningSchema.obj,
        count: { type: Number, default: 0 },
        highlights: { type: [String], default: [] },
      },
      certifications_value: {
        ...scoreWithReasoningSchema.obj,
        count: { type: Number, default: 0 },
        relevant: { type: [String], default: [] },
      },
      language_fit: {
        score: { type: Number, required: true },
        required_met: { type: Boolean, default: true },
        languages: {
          type: [
            new Schema(
              {
                name: { type: String, required: true },
                proficiency: { type: String, required: true },
              },
              { _id: false },
            ),
          ],
          default: [],
        },
      },
      availability_fit: {
        score: { type: Number, required: true },
        status: { type: String, default: "" },
        type_match: { type: Boolean, default: true },
        earliest_start: { type: String, default: null },
      },
    },
    weights_used: {
      skills_match: { type: Number, required: true },
      experience_relevance: { type: Number, required: true },
      project_quality: { type: Number, required: true },
      education_fit: { type: Number, required: true },
      certifications_value: { type: Number, required: true },
      language_fit: { type: Number, required: true },
      availability_fit: { type: Number, required: true },
    },
    flags: {
      career_gap: { type: Boolean, default: false },
      overqualified: { type: Boolean, default: false },
      location_mismatch: { type: Boolean, default: false },
      incomplete_profile: { type: Boolean, default: false },
    },
    rank: { type: Number, required: true },
    percentile: { type: Number, required: true },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    recommendation: { type: String, required: true },
    manual_review: {
      additional_info: { type: String, default: "" },
      previous_verdict: {
        type: String,
        enum: ["Shortlisted", "Review", "Rejected"],
        default: null,
      },
      updated_verdict: {
        type: String,
        enum: ["Shortlisted", "Review", "Rejected"],
        default: null,
      },
      reviewed_at: { type: Date, default: null },
    },
    recruiter_decision: {
      verdict: {
        type: String,
        enum: ["Shortlisted", "Rejected"],
        default: null,
      },
      decided_at: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

ScreeningResultSchema.index({ screening_run_id: 1, rank: 1 }, { unique: true });
ScreeningResultSchema.index({ screening_run_id: 1, candidate_id: 1 }, { unique: true });

export const ScreeningResultModel = model(
  "ScreeningResult",
  ScreeningResultSchema,
);

export default ScreeningResultModel;
