import { Schema, model } from "mongoose";

const ScreeningRunSchema = new Schema(
  {
    job_id: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    applicants_ids: {
      type: [Schema.Types.ObjectId],
      ref: "Applicant",
      required: true,
    },
    topK: { type: Number, required: true, default: 10 },
    status: {
      type: String,
      required: true,
      enum: ["queued", "completed", "failed"],
      default: "queued",
    },
    error: { type: String },
    model: { type: String },
  },
  { timestamps: true },
);

ScreeningRunSchema.index({ jobId: 1, createdAt: -1 });

const ScreeningRunModel = model("ScreeningRun", ScreeningRunSchema);

export default ScreeningRunModel;
