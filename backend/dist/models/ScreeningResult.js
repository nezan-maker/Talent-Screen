import { Schema, model } from "mongoose";
const ScreeningResultSchema = new Schema({
    screeningRunId: { type: Schema.Types.ObjectId, ref: "ScreeningRun", required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    applicantId: { type: Schema.Types.ObjectId, ref: "Applicant", required: true },
    rank: { type: Number, required: true },
    matchScore: { type: Number, required: true },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    recommendation: { type: String, required: true }
}, { timestamps: true });
ScreeningResultSchema.index({ screeningRunId: 1, rank: 1 }, { unique: true });
export const ScreeningResultModel = model("ScreeningResult", ScreeningResultSchema);
//# sourceMappingURL=ScreeningResult.js.map