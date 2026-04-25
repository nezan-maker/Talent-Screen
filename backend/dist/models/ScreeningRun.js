import { Schema, model } from "mongoose";
import { buildEntityId } from "../utils/ids.js";
const ScreeningRunSchema = new Schema({
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
    },
    topK: { type: Number, required: true, default: 10 },
    status: {
        type: String,
        required: true,
        enum: ["queued", "running", "completed", "failed"],
        default: "queued",
    },
    error: { type: String, default: "" },
    model: { type: String, default: "" },
    started_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    result_count: { type: Number, default: 0 },
}, { timestamps: true });
ScreeningRunSchema.index({ job_id: 1, createdAt: -1 });
const ScreeningRunModel = model("ScreeningRun", ScreeningRunSchema);
export default ScreeningRunModel;
//# sourceMappingURL=ScreeningRun.js.map