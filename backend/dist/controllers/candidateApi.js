import Applicant from "../models/Applicant.js";
import { mapApplicantToFrontend } from "../utils/frontendMappers.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { trimText } from "../utils/talentProfile.js";
export async function getCandidates(req, res) {
    try {
        const { page, pageSize, skip, limit } = parsePagination(req.query);
        const userId = req.currentUserId;
        if (!userId) {
            return res.status(401).json({ expiration_error: "Session expired" });
        }
        const filter = { user_id: userId };
        const [totalCandidates, applicants] = await Promise.all([
            Applicant.countDocuments(filter),
            Applicant.find({ user_id: userId })
                .sort({ updatedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);
        return res.status(200).json({
            candidates: applicants.map(mapApplicantToFrontend),
            pagination: buildPaginationMeta(totalCandidates, page, pageSize),
        });
    }
    catch (error) {
        console.error("Error in getCandidates:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
export async function getCandidateById(req, res) {
    try {
        const id = trimText(req.params.id);
        const userId = req.currentUserId;
        if (!userId) {
            return res.status(401).json({ expiration_error: "Session expired" });
        }
        const applicant = await Applicant.findOne({
            _id: id,
            user_id: userId,
        }).lean();
        if (!applicant) {
            return res.status(404).json({ data_error: "Candidate not found" });
        }
        return res.status(200).json({
            candidate: mapApplicantToFrontend(applicant),
        });
    }
    catch (error) {
        console.error("Error in getCandidateById:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
//# sourceMappingURL=candidateApi.js.map