import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import { buildDashboardStats, mapApplicantToFrontend, mapJobToFrontend, } from "../utils/frontendMappers.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
export async function getDashboardOverview(req, res) {
    try {
        const jobsPagination = parsePagination(req.query, {
            pageKey: "jobsPage",
            pageSizeKey: "jobsPageSize",
        });
        const applicantsPagination = parsePagination(req.query, {
            pageKey: "applicantsPage",
            pageSizeKey: "applicantsPageSize",
        });
        const [jobs, applicants] = await Promise.all([
            Job.find().sort({ updatedAt: -1, createdAt: -1 }).lean(),
            Applicant.find().sort({ updatedAt: -1, createdAt: -1 }).lean(),
        ]);
        const mappedApplicants = applicants.map(mapApplicantToFrontend);
        const mappedJobs = jobs.map((job) => mapJobToFrontend(job, mappedApplicants));
        const pagedApplicants = mappedApplicants.slice(applicantsPagination.skip, applicantsPagination.skip + applicantsPagination.limit);
        const pagedJobs = mappedJobs.slice(jobsPagination.skip, jobsPagination.skip + jobsPagination.limit);
        return res.status(200).json({
            applicants: pagedApplicants,
            jobs: pagedJobs,
            stats: buildDashboardStats(mappedJobs, mappedApplicants),
            pagination: {
                applicants: buildPaginationMeta(mappedApplicants.length, applicantsPagination.page, applicantsPagination.pageSize),
                jobs: buildPaginationMeta(mappedJobs.length, jobsPagination.page, jobsPagination.pageSize),
            },
        });
    }
    catch (error) {
        console.error("Error in getDashboardOverview:", error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
}
//# sourceMappingURL=dashboardApi.js.map