import { Schema, model } from "mongoose";
<<<<<<< HEAD
import { buildEntityId } from "../utils/ids.js";

const ScreeningRunSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => buildEntityId("screen"),
    },
    job_id: { type: String, ref: "Job", required: true, index: true },
    job_title: { type: String, required: true },
    applicant_ids: {
      type: [String],
      ref: "Applicant",
      required: true,
      default: [],
=======

const ScreeningRunSchema = new Schema(
  {
    job_id: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    applicants_ids: {
      type: [Schema.Types.ObjectId],
      ref: "Applicant",
      required: true,
>>>>>>> a0dac98 (Refined the screening ai service)
    },
    topK: { type: Number, required: true, default: 10 },
    status: {
      type: String,
      required: true,
<<<<<<< HEAD
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    error: { type: String, default: "" },
    model: { type: String, default: "" },
    started_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    result_count: { type: Number, default: 0 },
=======
      enum: ["queued", "completed", "failed"],
      default: "queued",
    },
    error: { type: String },
    model: { type: String },
>>>>>>> a0dac98 (Refined the screening ai service)
  },
  { timestamps: true },
);

<<<<<<< HEAD
ScreeningRunSchema.index({ job_id: 1, createdAt: -1 });
=======
ScreeningRunSchema.index({ jobId: 1, createdAt: -1 });
>>>>>>> a0dac98 (Refined the screening ai service)

const ScreeningRunModel = model("ScreeningRun", ScreeningRunSchema);

export default ScreeningRunModel;
