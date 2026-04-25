import mongoose, {} from "mongoose";
import connectDB from "../config/db.js";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { ScreeningResultModel as Result } from "../models/ScreenResult.js";
import User from "../models/User.js";
const models = [User, Job, Applicant, Resume, Result];
function isNamespaceExistsError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }
    return "code" in error && error.code === 48;
}
async function ensureCollection(model) {
    try {
        await model.createCollection();
    }
    catch (error) {
        if (!isNamespaceExistsError(error)) {
            throw error;
        }
    }
}
async function runMigrations() {
    await connectDB();
    for (const model of models) {
        await ensureCollection(model);
        await model.createIndexes();
        console.log(`Migration ready for ${model.collection.collectionName}`);
    }
    await mongoose.disconnect();
    console.log("Database migration completed successfully");
}
runMigrations().catch(async (error) => {
    console.error("Database migration failed", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map