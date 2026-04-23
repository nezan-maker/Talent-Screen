const GENERIC_EMAIL_DOMAINS = new Set([
    "gmail",
    "hotmail",
    "icloud",
    "outlook",
    "yahoo",
]);
function toId(value) {
    if (value == null) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "object" &&
        value !== null &&
        "toString" in value &&
        typeof value.toString === "function") {
        return value.toString();
    }
    return String(value);
}
function toIso(value) {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }
    return parsed.toISOString();
}
function splitList(value) {
    if (!value) {
        return [];
    }
    const raw = typeof value === "string"
        ? value
        : Array.isArray(value)
            ? value.join(",")
            : String(value);
    return Array.from(new Set(raw
        .split(/[\n,;|]/)
        .map((item) => item.trim())
        .filter(Boolean)));
}
function inferLocation(value) {
    const normalized = String(value ?? "").trim();
    return normalized || "Location not provided";
}
function findLinkedIn(values) {
    return values.find((item) => item.toLowerCase().includes("linkedin"));
}
function normalizeCompanyName(value) {
    const email = String(value ?? "").trim().toLowerCase();
    const domain = email.split("@")[1];
    const domainName = domain?.split(".")[0];
    if (!domainName || GENERIC_EMAIL_DOMAINS.has(domainName)) {
        return "Independent Recruiter";
    }
    return domainName
        .split(/[-_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function normalizeJobStatus(value) {
    const status = String(value ?? "").trim().toLowerCase();
    if (status === "complete" || status === "completed") {
        return "Complete";
    }
    if (status === "screening") {
        return "Screening";
    }
    if (status === "active") {
        return "Active";
    }
    return "Draft";
}
function neutralTrend(label) {
    return {
        label,
        value: "No change",
        direction: "neutral",
    };
}
function pickCriterionText(criteria, matcher) {
    return criteria
        .filter(matcher)
        .map((criterion) => String(criterion.criteria_string ?? "").trim())
        .filter(Boolean)
        .join(", ");
}
export function inferDefaultCompanyName(userEmail) {
    return normalizeCompanyName(userEmail);
}
export function mapUserToFrontend(user) {
    return {
        id: toId(user?._id),
        name: String(user?.user_name ?? "").trim(),
        email: String(user?.user_email ?? "").trim(),
        isVerified: Boolean(user?.isVerified),
        createdAtISO: toIso(user?.createdAt),
        updatedAtISO: toIso(user?.updatedAt),
    };
}
export function mapApplicantToFrontend(applicant) {
    const additionalInfo = splitList(applicant?.additional_info);
    const email = String(applicant?.applicant_email ?? "").trim() ||
        additionalInfo.find((item) => /\S+@\S+\.\S+/.test(item));
    const linkedIn = findLinkedIn(additionalInfo);
    const softSignals = additionalInfo.filter((item) => item !== email && item !== linkedIn);
    return {
        id: toId(applicant?._id),
        name: String(applicant?.applicant_name ?? "").trim(),
        currentTitle: String(applicant?.job_title ?? "").trim(),
        location: inferLocation(applicant?.location),
        yearsExperience: Number(applicant?.experience ?? 0),
        email: email || undefined,
        linkedIn: linkedIn || undefined,
        shortlisted: Boolean(applicant?.shortlisted),
        appliedJobTitle: String(applicant?.job_title ?? "").trim(),
        createdAtISO: toIso(applicant?.createdAt),
        updatedAtISO: toIso(applicant?.updatedAt),
        skills: {
            technical: splitList(applicant?.skills),
            soft: softSignals,
        },
        education: splitList(applicant?.education),
        workHistory: [],
    };
}
export function mapJobToFrontend(job, applicants) {
    const criteriaSource = Array.isArray(job?.job_ai_criteria)
        ? job.job_ai_criteria
        : Array.isArray(job?.job_description)
            ? job.job_description
            : [];
    const criteria = criteriaSource.filter((criterion) => Boolean(criterion && typeof criterion === "object"));
    const title = String(job?.job_title ?? "").trim();
    const applicantsForJob = applicants.filter((candidate) => candidate.appliedJobTitle.trim().toLowerCase() === title.toLowerCase());
    const mustHaveSkills = pickCriterionText(criteria, (criterion) => String(criterion.priority ?? "").toLowerCase() === "high") || pickCriterionText(criteria, () => true);
    const niceToHaveSkills = pickCriterionText(criteria, (criterion) => String(criterion.priority ?? "").toLowerCase() === "medium");
    const screeningQuestions = criteria
        .filter((criterion) => String(criterion.criteria_string ?? "")
        .toLowerCase()
        .includes("question"))
        .map((criterion) => String(criterion.description ?? "").trim())
        .filter(Boolean)
        .join("\n");
    const dealBreakers = criteria
        .filter((criterion) => `${criterion.criteria_string ?? ""} ${criterion.description ?? ""}`
        .toLowerCase()
        .includes("deal breaker"))
        .map((criterion) => String(criterion.description ?? "").trim())
        .filter(Boolean)
        .join(", ");
    const description = typeof job?.job_description === "string"
        ? job.job_description
        : criteria
            .map((criterion) => String(criterion.description ?? "").trim())
            .filter(Boolean)
            .join("\n");
    const shortlistSize = Number(job?.job_shortlist_size) === 20 ? 20 : 10;
    return {
        id: toId(job?._id),
        title,
        department: String(job?.job_department ?? "").trim(),
        location: inferLocation(job?.job_location),
        employmentType: String(job?.job_employment_type ?? "").trim() || "Full-time",
        experienceLevel: String(job?.job_experience_required ?? "").trim() || "Not specified",
        salaryMin: typeof job?.job_salary_min === "number" ? job.job_salary_min : undefined,
        salaryMax: typeof job?.job_salary_max === "number" ? job.job_salary_max : undefined,
        description: String(description ?? "").trim(),
        responsibilities: String(job?.job_responsibilities ?? "").trim(),
        qualifications: String(job?.job_qualifications ?? "").trim(),
        aiCriteria: {
            mustHaveSkills,
            niceToHaveSkills,
            screeningQuestions,
            dealBreakers,
            shortlistSize,
        },
        status: normalizeJobStatus(job?.job_state),
        applicantsCount: applicantsForJob.length,
        shortlistedCount: applicantsForJob.filter((candidate) => candidate.shortlisted)
            .length,
        updatedAtISO: toIso(job?.updatedAt) || toIso(job?.createdAt) || new Date().toISOString(),
    };
}
export function buildDashboardStats(jobs, applicants) {
    const activeJobs = jobs.filter((job) => job.status === "Active" || job.status === "Screening").length;
    const shortlisted = applicants.filter((candidate) => candidate.shortlisted)
        .length;
    const screeningJobs = jobs.filter((job) => job.status === "Screening").length;
    return {
        activeJobs: {
            value: activeJobs,
            trend: neutralTrend("based on current data"),
        },
        totalApplicants: {
            value: applicants.length,
            trend: neutralTrend("based on current data"),
        },
        shortlisted: {
            value: shortlisted,
            trend: neutralTrend("based on current data"),
            conversionRatePct: applicants.length > 0
                ? Math.round((shortlisted / applicants.length) * 100)
                : 0,
        },
        inScreening: {
            value: screeningJobs,
            trend: neutralTrend("based on current data"),
            avgTimePerCandidateMins: applicants.length > 0 ? 8 : 0,
        },
    };
}
//# sourceMappingURL=frontendMappers.js.map