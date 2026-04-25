import { buildEntityId } from "../utils/ids.js";
import { extractHeadlineFromExperience, inferExperienceYears, normalizeAvailability, normalizeEducation, normalizeExperience, normalizeLanguages, normalizeProjects, normalizeSkills, parseJobCriteria, splitList, trimText, } from "../utils/talentProfile.js";
import { enrichScreeningNarratives } from "../lib/gemini.js";
const DEFAULT_WEIGHTS = {
    skills_match: 0.3,
    experience_relevance: 0.25,
    project_quality: 0.15,
    education_fit: 0.1,
    certifications_value: 0.1,
    language_fit: 0.05,
    availability_fit: 0.05,
};
function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
}
function parseRequiredYears(job) {
    const text = `${trimText(job?.job_experience_required)} ${trimText(job?.job_qualifications)}`.toLowerCase();
    const numericMatch = text.match(/(\d+)\+?\s*years?/);
    if (numericMatch) {
        return Number(numericMatch[1]);
    }
    if (text.includes("lead"))
        return 7;
    if (text.includes("senior"))
        return 5;
    if (text.includes("mid"))
        return 3;
    if (text.includes("junior"))
        return 1;
    return 2;
}
function tokenizeJobCriteria(job) {
    const criteria = parseJobCriteria(job?.job_ai_criteria);
    const mustHave = splitList(criteria
        .filter((criterion) => trimText(criterion.priority).toLowerCase() === "high")
        .map((criterion) => criterion.criteria_string)
        .join(", "));
    const niceToHave = splitList(criteria
        .filter((criterion) => trimText(criterion.priority).toLowerCase() !== "high")
        .map((criterion) => criterion.criteria_string)
        .join(", "));
    return {
        mustHave,
        niceToHave,
        descriptionTokens: splitList([job?.job_description, job?.job_qualifications, job?.job_responsibilities]
            .filter(Boolean)
            .join(", ")),
    };
}
function fuzzyIncludes(values, target) {
    const normalizedTarget = trimText(target).toLowerCase();
    return values.some((value) => {
        const normalizedValue = trimText(value).toLowerCase();
        return (normalizedValue === normalizedTarget ||
            normalizedValue.includes(normalizedTarget) ||
            normalizedTarget.includes(normalizedValue));
    });
}
function gradeFromScore(score) {
    if (score >= 85)
        return "A";
    if (score >= 70)
        return "B";
    if (score >= 55)
        return "C";
    return "D";
}
function summarizeEducation(education) {
    if (!education.length) {
        return {
            degreeLevel: "Not provided",
            fieldRelevance: "Low",
            score: 40,
            reasoning: "No structured education history was provided.",
        };
    }
    const first = education[0];
    const degreeLevel = trimText(first?.degree) || "Degree";
    const field = trimText(first?.field_of_study).toLowerCase();
    let fieldRelevance = "Medium";
    let score = 70;
    if (/computer|software|information|design|human resource|business/i.test(field)) {
        fieldRelevance = "High";
        score = 82;
    }
    else if (field) {
        fieldRelevance = "Medium";
        score = 68;
    }
    return {
        degreeLevel,
        fieldRelevance,
        score,
        reasoning: `${degreeLevel} background with ${fieldRelevance.toLowerCase()} relevance to the role.`,
    };
}
function detectCareerGap(experience) {
    const parsedRanges = experience
        .map((item) => ({
        start: Date.parse(item.start_date),
        end: item.is_current ? Date.now() : Date.parse(item.end_date),
    }))
        .filter((item) => !Number.isNaN(item.start) && !Number.isNaN(item.end) && item.end >= item.start)
        .sort((left, right) => left.start - right.start);
    for (let index = 1; index < parsedRanges.length; index += 1) {
        const previous = parsedRanges[index - 1];
        const current = parsedRanges[index];
        if (!previous || !current) {
            continue;
        }
        const gapMonths = (current.start - previous.end) / (1000 * 60 * 60 * 24 * 30);
        if (gapMonths > 12) {
            return true;
        }
    }
    return false;
}
function buildDeterministicSummary(input) {
    const strengthsText = input.keyStrengths.length > 0
        ? input.keyStrengths.slice(0, 3).join(", ")
        : "relevant profile signals";
    const missingText = input.missing.length > 0
        ? `Minor gaps remain around ${input.missing.slice(0, 2).join(", ")}.`
        : "No major gaps were detected in the current profile.";
    return `${input.candidateName} shows solid fit for ${input.roleTitle} with ${input.totalYears}+ years of relevant experience and clear strength in ${strengthsText}. ${missingText}`;
}
export async function evaluateApplicantsForJob(input) {
    const requiredYears = parseRequiredYears(input.job);
    const remoteFriendly = trimText(input.job?.job_location).toLowerCase().includes("remote");
    const jobCriteria = tokenizeJobCriteria(input.job);
    const evaluated = input.applicants.map((applicant) => {
        const skills = normalizeSkills(applicant?.skills);
        const experience = normalizeExperience(applicant?.experience);
        const education = normalizeEducation(applicant?.education);
        const languages = normalizeLanguages(applicant?.languages);
        const projects = normalizeProjects(applicant?.projects);
        const availability = normalizeAvailability(applicant?.availability);
        const skillNames = skills.map((skill) => skill.name);
        const projectTechnologies = projects.flatMap((project) => project.technologies);
        const experienceTechnologies = experience.flatMap((entry) => entry.technologies);
        const evidencePool = [
            ...skillNames,
            ...projectTechnologies,
            ...experienceTechnologies,
            trimText(applicant?.headline),
            trimText(applicant?.bio),
        ].filter(Boolean);
        const matched = jobCriteria.mustHave.filter((item) => fuzzyIncludes(evidencePool, item));
        const missing = jobCriteria.mustHave.filter((item) => !fuzzyIncludes(evidencePool, item));
        const niceMatches = jobCriteria.niceToHave.filter((item) => fuzzyIncludes(evidencePool, item));
        const skillsScore = clampScore((jobCriteria.mustHave.length
            ? (matched.length / jobCriteria.mustHave.length) * 75
            : 55) +
            (jobCriteria.niceToHave.length
                ? (niceMatches.length / jobCriteria.niceToHave.length) * 25
                : 10));
        const totalYears = inferExperienceYears(experience);
        const relevantYears = Math.min(totalYears, matched.length > 0 ? totalYears : Math.max(0, totalYears - 1));
        const experienceScore = clampScore(Math.min(100, (totalYears / Math.max(requiredYears, 1)) * 75 + (matched.length > 0 ? 20 : 10)));
        const educationSummary = summarizeEducation(education);
        const projectHighlights = projects
            .slice(0, 2)
            .map((project) => trimText(project.description || project.name))
            .filter(Boolean);
        const relevantCertifications = (applicant?.certifications ?? [])
            .map((item) => trimText(item?.name))
            .filter(Boolean)
            .filter((name) => fuzzyIncludes([...jobCriteria.mustHave, ...jobCriteria.niceToHave, ...jobCriteria.descriptionTokens], name));
        const projectScore = clampScore(projects.length === 0
            ? 40
            : Math.min(100, 55 + matched.length * 6 + projects.length * 8));
        const certificationScore = clampScore(applicant?.certifications?.length
            ? 50 + relevantCertifications.length * 18
            : 35);
        const languageScore = clampScore(languages.some((language) => trimText(language.name).toLowerCase() === "english")
            ? 95
            : languages.length > 0
                ? 75
                : 60);
        const typeMatch = trimText(availability.type).toLowerCase() ===
            trimText(input.job?.job_employment_type).toLowerCase() ||
            trimText(availability.type) === "";
        const availabilityScore = clampScore(trimText(availability.status).toLowerCase().includes("available")
            ? typeMatch
                ? 100
                : 80
            : trimText(availability.status).toLowerCase().includes("open")
                ? 82
                : 55);
        const overallScore = clampScore(skillsScore * DEFAULT_WEIGHTS.skills_match +
            experienceScore * DEFAULT_WEIGHTS.experience_relevance +
            projectScore * DEFAULT_WEIGHTS.project_quality +
            educationSummary.score * DEFAULT_WEIGHTS.education_fit +
            certificationScore * DEFAULT_WEIGHTS.certifications_value +
            languageScore * DEFAULT_WEIGHTS.language_fit +
            availabilityScore * DEFAULT_WEIGHTS.availability_fit);
        const keyStrengths = [
            ...matched,
            ...niceMatches,
            extractHeadlineFromExperience(experience, trimText(applicant?.headline)),
        ].filter(Boolean);
        const overqualified = requiredYears <= 1 && totalYears >= 6 && overallScore >= 85;
        const locationMismatch = Boolean(!remoteFriendly &&
            trimText(applicant?.location) &&
            trimText(applicant?.location).toLowerCase() !==
                trimText(input.job?.job_location).toLowerCase());
        const incompleteProfile = skills.length === 0 || experience.length === 0 || education.length === 0;
        const summary = buildDeterministicSummary({
            candidateName: trimText(applicant?.applicant_name) || "Candidate",
            roleTitle: trimText(input.job?.job_title) || "the role",
            matched,
            missing,
            totalYears,
            keyStrengths,
        });
        return {
            candidate_id: trimText(applicant?._id),
            applicant_id: trimText(applicant?._id),
            candidate_name: trimText(applicant?.applicant_name) || "Candidate",
            evaluated_at: new Date(),
            overall: {
                score: overallScore,
                grade: gradeFromScore(overallScore),
                verdict: "Review",
                summary,
            },
            dimension_scores: {
                skills_match: {
                    score: skillsScore,
                    matched,
                    missing,
                    reasoning: `Matched ${matched.length} of ${jobCriteria.mustHave.length || matched.length} core skill signals.`,
                },
                experience_relevance: {
                    score: experienceScore,
                    total_years: totalYears,
                    relevant_years: relevantYears,
                    highlights: experience
                        .slice(0, 2)
                        .map((item) => trimText(item.description || `${item.role} at ${item.company}`))
                        .filter(Boolean),
                    reasoning: `Estimated ${totalYears} total years against a target of ${requiredYears}.`,
                },
                education_fit: {
                    score: educationSummary.score,
                    degree_level: educationSummary.degreeLevel,
                    field_relevance: educationSummary.fieldRelevance,
                    reasoning: educationSummary.reasoning,
                },
                project_quality: {
                    score: projectScore,
                    count: projects.length,
                    highlights: projectHighlights,
                    reasoning: projects.length > 0
                        ? "Projects add useful evidence beyond employment history."
                        : "No structured project portfolio was provided.",
                },
                certifications_value: {
                    score: certificationScore,
                    count: Array.isArray(applicant?.certifications)
                        ? applicant.certifications.length
                        : 0,
                    relevant: relevantCertifications,
                    reasoning: relevantCertifications.length > 0
                        ? "Relevant certifications strengthen the profile."
                        : "Few role-specific certifications were visible.",
                },
                language_fit: {
                    score: languageScore,
                    required_met: languageScore >= 75,
                    languages: languages.map((item) => ({
                        name: trimText(item.name),
                        proficiency: trimText(item.proficiency),
                    })),
                },
                availability_fit: {
                    score: availabilityScore,
                    status: trimText(availability.status),
                    type_match: typeMatch,
                    earliest_start: availability.start_date,
                },
            },
            weights_used: { ...DEFAULT_WEIGHTS },
            flags: {
                career_gap: detectCareerGap(experience),
                overqualified,
                location_mismatch: locationMismatch,
                incomplete_profile: incompleteProfile,
            },
            strengths: Array.from(new Set(keyStrengths)).slice(0, 4),
            gaps: Array.from(new Set([
                ...missing,
                ...(locationMismatch ? ["Location mismatch"] : []),
                ...(incompleteProfile ? ["Incomplete profile"] : []),
            ])).slice(0, 4),
            recommendation: overallScore >= 85
                ? "Strong shortlist candidate"
                : overallScore >= 70
                    ? "Worth recruiter review"
                    : "Not recommended for the first shortlist",
            rank: 0,
            percentile: 0,
        };
    });
    evaluated.sort((left, right) => right.overall.score - left.overall.score);
    const shortlistIds = new Set(evaluated.slice(0, input.topK).map((item) => item.candidate_id));
    const totalCount = evaluated.length || 1;
    evaluated.forEach((item, index) => {
        item.rank = index + 1;
        item.percentile = clampScore(((totalCount - index) / totalCount) * 100);
        item.overall.verdict = shortlistIds.has(item.candidate_id)
            ? "Shortlisted"
            : item.overall.score >= 60
                ? "Review"
                : "Rejected";
    });
    const enriched = await enrichScreeningNarratives({
        job: {
            title: trimText(input.job?.job_title),
            description: trimText(input.job?.job_description),
            qualifications: trimText(input.job?.job_qualifications),
            criteria: [
                ...jobCriteria.mustHave,
                ...jobCriteria.niceToHave,
                ...jobCriteria.descriptionTokens,
            ],
        },
        candidates: evaluated.slice(0, Math.min(evaluated.length, input.topK)).map((item) => ({
            candidate_id: item.candidate_id,
            candidate_name: item.candidate_name,
            score: item.overall.score,
            matched: item.dimension_scores.skills_match.matched,
            missing: item.dimension_scores.skills_match.missing,
            reasoning: item.overall.summary,
        })),
    });
    if (enriched) {
        for (const item of enriched) {
            const match = evaluated.find((evaluation) => evaluation.candidate_id === trimText(item.candidate_id));
            if (!match) {
                continue;
            }
            if (trimText(item.summary)) {
                match.overall.summary = trimText(item.summary);
            }
            if (Array.isArray(item.strengths) && item.strengths.length > 0) {
                match.strengths = item.strengths.map((entry) => trimText(entry)).filter(Boolean);
            }
            if (Array.isArray(item.gaps) && item.gaps.length > 0) {
                match.gaps = item.gaps.map((entry) => trimText(entry)).filter(Boolean);
            }
            if (trimText(item.recommendation)) {
                match.recommendation = trimText(item.recommendation);
            }
        }
    }
    const results = evaluated.map((item) => ({
        screening_id: buildEntityId("screening"),
        screening_run_id: input.runId,
        candidate_id: item.candidate_id,
        job_id: trimText(input.job?._id),
        evaluated_at: item.evaluated_at,
        overall: item.overall,
        dimension_scores: item.dimension_scores,
        weights_used: item.weights_used,
        flags: item.flags,
        rank: item.rank,
        percentile: item.percentile,
        strengths: item.strengths,
        gaps: item.gaps,
        recommendation: item.recommendation,
    }));
    const shortlist = results.slice(0, input.topK);
    const resultVerdict = `Screened ${results.length} applicants for ${trimText(input.job?.job_title)}. Top ${Math.min(input.topK, shortlist.length)} candidates are ready for recruiter review.`;
    return {
        results,
        shortlist,
        resultVerdict,
    };
}
//# sourceMappingURL=screeningService.js.map