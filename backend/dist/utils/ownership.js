import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import { trimText } from "./talentProfile.js";
function getLegacyUserIdFilter() {
    return [{ user_id: { $exists: false } }, { user_id: null }, { user_id: "" }];
}
export async function resolveOwnedJobs(input) {
    const userId = trimText(input.userId);
    const companyName = trimText(input.currentUser?.company_name);
    const ownedJobs = await Job.find({ user_id: userId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    if (ownedJobs.length > 0 || !companyName) {
        return ownedJobs;
    }
    const legacyJobs = await Job.find({
        company_name: companyName,
        $or: getLegacyUserIdFilter(),
    })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    if (legacyJobs.length === 0) {
        return ownedJobs;
    }
    await Job.updateMany({ _id: { $in: legacyJobs.map((job) => trimText(job._id)).filter(Boolean) } }, { $set: { user_id: userId } });
    return Job.find({ user_id: userId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
}
export async function resolveOwnedApplicants(input) {
    const userId = trimText(input.userId);
    const directApplicants = await Applicant.find({ user_id: userId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    const ownedJobIds = input.ownedJobs.map((job) => trimText(job._id)).filter(Boolean);
    const ownedJobTitles = input.ownedJobs
        .map((job) => trimText(job.job_title))
        .filter(Boolean);
    if (directApplicants.length > 0 ||
        (ownedJobIds.length === 0 && ownedJobTitles.length === 0)) {
        return directApplicants;
    }
    const legacyApplicants = await Applicant.find({
        $or: getLegacyUserIdFilter(),
        ...(ownedJobIds.length > 0 || ownedJobTitles.length > 0
            ? {
                $and: [
                    {
                        $or: [
                            ...(ownedJobIds.length > 0 ? [{ job_id: { $in: ownedJobIds } }] : []),
                            ...(ownedJobTitles.length > 0
                                ? [{ job_title: { $in: ownedJobTitles } }]
                                : []),
                        ],
                    },
                ],
            }
            : {}),
    })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    if (legacyApplicants.length === 0) {
        return directApplicants;
    }
    await Applicant.updateMany({
        _id: {
            $in: legacyApplicants
                .map((applicant) => trimText(applicant._id))
                .filter(Boolean),
        },
    }, { $set: { user_id: userId } });
    return Applicant.find({ user_id: userId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
}
//# sourceMappingURL=ownership.js.map