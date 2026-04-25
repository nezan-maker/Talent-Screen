export function trimText(value) {
    return String(value ?? "").trim();
}
export function slugify(value) {
    return trimText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export function normalizeLookupKey(value) {
    return trimText(value)
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
}
export function splitList(value) {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((item) => trimText(item)).filter(Boolean);
    }
    return trimText(value)
        .split(/[\n,;|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function safeJsonParse(value) {
    if (typeof value !== "string") {
        return null;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
function toNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function sentenceCase(value) {
    const normalized = trimText(value);
    if (!normalized) {
        return "";
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
function normalizeSkill(raw) {
    if (typeof raw === "object" && raw !== null) {
        const entry = raw;
        const name = trimText(entry.name);
        if (!name) {
            return null;
        }
        return {
            name,
            level: sentenceCase(trimText(entry.level) || "Intermediate"),
            yearsOfExperience: toNumber(entry.yearsOfExperience ?? entry.years_of_experience, 0) || 0,
        };
    }
    const text = trimText(raw);
    if (!text) {
        return null;
    }
    const [name, level, years] = text.split("|").map((part) => part.trim());
    return {
        name: name || "",
        level: sentenceCase(level || "Intermediate"),
        yearsOfExperience: toNumber(years, 0),
    };
}
export function normalizeSkills(value) {
    const jsonValue = safeJsonParse(value) ??
        (Array.isArray(value) ? value : splitList(value));
    return jsonValue
        .map((item) => normalizeSkill(item))
        .filter((item) => Boolean(item));
}
function normalizeLanguage(raw) {
    if (typeof raw === "object" && raw !== null) {
        const entry = raw;
        const name = trimText(entry.name);
        if (!name) {
            return null;
        }
        return {
            name,
            proficiency: sentenceCase(trimText(entry.proficiency) || "Conversational"),
        };
    }
    const text = trimText(raw);
    if (!text) {
        return null;
    }
    const [name, proficiency] = text.split("|").map((part) => part.trim());
    return {
        name: name || "",
        proficiency: sentenceCase(proficiency || "Conversational"),
    };
}
export function normalizeLanguages(value) {
    const jsonValue = safeJsonParse(value) ??
        (Array.isArray(value) ? value : splitList(value));
    return jsonValue
        .map((item) => normalizeLanguage(item))
        .filter((item) => Boolean(item));
}
function normalizeExperienceEntry(raw) {
    if (typeof raw === "object" && raw !== null) {
        const entry = raw;
        const role = trimText(entry.role);
        const company = trimText(entry.company);
        if (!role && !company) {
            return null;
        }
        return {
            company,
            role,
            start_date: trimText(entry.start_date ?? entry["Start Date"]),
            end_date: trimText(entry.end_date ?? entry["End Date"] ?? "Present"),
            description: trimText(entry.description),
            technologies: splitList(entry.technologies),
            is_current: Boolean(entry.is_current ?? entry["Is Current"]),
        };
    }
    const text = trimText(raw);
    if (!text) {
        return null;
    }
    return {
        company: "",
        role: text,
        start_date: "",
        end_date: "",
        description: "",
        technologies: [],
        is_current: false,
    };
}
export function normalizeExperience(value) {
    const jsonValue = safeJsonParse(value) ??
        (Array.isArray(value) ? value : splitList(value));
    return jsonValue
        .map((item) => normalizeExperienceEntry(item))
        .filter((item) => Boolean(item));
}
function normalizeEducationEntry(raw) {
    if (typeof raw === "object" && raw !== null) {
        const entry = raw;
        const institution = trimText(entry.institution);
        const degree = trimText(entry.degree);
        const field = trimText(entry.field_of_study ?? entry["Field of Study"]);
        if (!institution && !degree && !field) {
            return null;
        }
        return {
            institution,
            degree,
            field_of_study: field,
            start_year: toNumber(entry.start_year ?? entry["Start Year"], 0) || null,
            end_year: toNumber(entry.end_year ?? entry["End Year"], 0) || null,
        };
    }
    const text = trimText(raw);
    if (!text) {
        return null;
    }
    const [degree, institution] = text.split(" - ").map((part) => part.trim());
    return {
        institution: institution || "",
        degree: degree || text || "",
        field_of_study: "",
        start_year: null,
        end_year: null,
    };
}
export function normalizeEducation(value) {
    const jsonValue = safeJsonParse(value) ??
        (Array.isArray(value) ? value : splitList(value));
    return jsonValue
        .map((item) => normalizeEducationEntry(item))
        .filter((item) => Boolean(item));
}
function normalizeCertificationEntry(raw) {
    if (typeof raw === "object" && raw !== null) {
        const entry = raw;
        const name = trimText(entry.name);
        if (!name) {
            return null;
        }
        return {
            name,
            issuer: trimText(entry.issuer),
            issue_date: trimText(entry.issue_date ?? entry["Issue Date"]),
        };
    }
    const text = trimText(raw);
    if (!text) {
        return null;
    }
    const [name, issuer] = text.split(" - ").map((part) => part.trim());
    return {
        name: name || "",
        issuer: issuer || "",
        issue_date: "",
    };
}
export function normalizeCertifications(value) {
    const jsonValue = safeJsonParse(value) ??
        (Array.isArray(value) ? value : splitList(value));
    return jsonValue
        .map((item) => normalizeCertificationEntry(item))
        .filter((item) => Boolean(item));
}
function normalizeProjectEntry(raw) {
    if (typeof raw === "object" && raw !== null) {
        const entry = raw;
        const name = trimText(entry.name);
        if (!name) {
            return null;
        }
        return {
            name,
            description: trimText(entry.description),
            technologies: splitList(entry.technologies),
            role: trimText(entry.role),
            link: trimText(entry.link),
            start_date: trimText(entry.start_date ?? entry["Start Date"]),
            end_date: trimText(entry.end_date ?? entry["End Date"]),
        };
    }
    const text = trimText(raw);
    if (!text) {
        return null;
    }
    return {
        name: text,
        description: "",
        technologies: [],
        role: "",
        link: "",
        start_date: "",
        end_date: "",
    };
}
export function normalizeProjects(value) {
    const jsonValue = safeJsonParse(value) ??
        (Array.isArray(value) ? value : splitList(value));
    return jsonValue
        .map((item) => normalizeProjectEntry(item))
        .filter((item) => Boolean(item));
}
export function normalizeAvailability(value) {
    if (typeof value === "object" && value !== null) {
        const entry = value;
        return {
            status: trimText(entry.status) || "Open to Opportunities",
            type: trimText(entry.type) || "Full-time",
            start_date: trimText(entry.start_date ?? entry["Start Date"]) || null,
        };
    }
    const status = trimText(value);
    return {
        status: status || "Open to Opportunities",
        type: "Full-time",
        start_date: null,
    };
}
export function normalizeSocialLinks(value) {
    if (typeof value === "object" && value !== null) {
        const entry = value;
        return {
            linkedin: trimText(entry.linkedin ?? entry.linked_in) || "",
            github: trimText(entry.github) || "",
            portfolio: trimText(entry.portfolio) || "",
        };
    }
    const links = splitList(value);
    return {
        linkedin: links.find((item) => item.toLowerCase().includes("linkedin")) || "",
        github: links.find((item) => item.toLowerCase().includes("github")) || "",
        portfolio: links.find((item) => /^https?:\/\//i.test(item)) || "",
    };
}
export function extractHeadlineFromExperience(experience, fallback = "Talent Profile") {
    const currentRole = experience.find((item) => item.is_current)?.role;
    if (currentRole) {
        return currentRole;
    }
    return trimText(experience[0]?.role) || fallback;
}
export function getDisplayName(value) {
    const explicit = trimText(value.applicant_name);
    if (explicit) {
        return explicit;
    }
    return `${trimText(value.first_name)} ${trimText(value.last_name)}`.trim();
}
export function extractEmailAndLinks(additionalInfo) {
    const email = additionalInfo.find((item) => /\S+@\S+\.\S+/.test(item));
    const linkedin = additionalInfo.find((item) => item.toLowerCase().includes("linkedin"));
    const github = additionalInfo.find((item) => item.toLowerCase().includes("github"));
    const portfolio = additionalInfo.find((item) => /^https?:\/\//i.test(item) &&
        !item.toLowerCase().includes("linkedin") &&
        !item.toLowerCase().includes("github"));
    return { email, linkedin, github, portfolio };
}
export function inferExperienceYears(experience) {
    if (!experience.length) {
        return 0;
    }
    let totalMonths = 0;
    for (const entry of experience) {
        const start = Date.parse(entry.start_date);
        const end = entry.is_current
            ? Date.now()
            : Date.parse(entry.end_date || entry.start_date);
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
            continue;
        }
        totalMonths += Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
    }
    return Math.max(0, Math.round((totalMonths / 12) * 10) / 10);
}
export function parseJobCriteria(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }
            const entry = item;
            const criteria_string = trimText(entry.criteria_string);
            const description = trimText(entry.description);
            if (!criteria_string && !description) {
                return null;
            }
            return {
                criteria_string: criteria_string || "Criteria",
                description,
                priority: trimText(entry.priority) || "medium",
            };
        })
            .filter((item) => Boolean(item));
    }
    return splitList(value).map((item) => ({
        criteria_string: item,
        description: item,
        priority: "medium",
    }));
}
export function buildNormalizedApplicant(input) {
    const applicant_name = getDisplayName(input);
    const [first_name, ...lastParts] = applicant_name.split(/\s+/).filter(Boolean);
    const last_name = trimText(input.last_name) || lastParts.join(" ") || trimText(input.first_name);
    const additional_info = splitList(input.additional_info);
    const extracted = extractEmailAndLinks(additional_info);
    const skills = normalizeSkills(input.skills);
    const experience = normalizeExperience(input.experience);
    const languages = normalizeLanguages(input.languages ?? input.language);
    const education = normalizeEducation(input.education);
    const certifications = normalizeCertifications(input.certifications);
    const projects = normalizeProjects(input.projects);
    const availability = normalizeAvailability(input.availability);
    const social_links = {
        ...normalizeSocialLinks(input.social_links ?? input.socialLinks),
        ...(extracted.linkedin ? { linkedin: extracted.linkedin } : {}),
        ...(extracted.github ? { github: extracted.github } : {}),
        ...(extracted.portfolio ? { portfolio: extracted.portfolio } : {}),
    };
    const email = trimText(input.applicant_email ?? input.email) ||
        extracted.email ||
        `${slugify(applicant_name || "candidate")}@talent.local`;
    const inferredHeadline = extractHeadlineFromExperience(experience, trimText(input.job_title) || "Talent Profile");
    const bio = trimText(input.bio) ||
        [
            trimText(input.headline),
            projects[0]?.description,
            experience[0]?.description,
        ]
            .filter(Boolean)
            .join(" ");
    const yearsExperience = toNumber(input.experience_in_years, inferExperienceYears(experience)) ||
        inferExperienceYears(experience);
    const synthesizedExperience = experience.length > 0
        ? experience
        : yearsExperience > 0
            ? [
                {
                    company: "",
                    role: trimText(input.headline) || trimText(input.job_title),
                    start_date: "",
                    end_date: "",
                    description: "",
                    technologies: skills.map((item) => item.name),
                    is_current: false,
                },
            ]
            : [];
    return {
        first_name: trimText(input.first_name) || first_name || "Talent",
        last_name,
        applicant_name,
        email,
        headline: trimText(input.headline) || inferredHeadline,
        bio,
        location: trimText(input.location) || "Location not provided",
        job_id: trimText(input.job_id) || "",
        job_title: trimText(input.job_title),
        skills,
        languages,
        experience: synthesizedExperience,
        education,
        certifications,
        projects,
        availability,
        social_links,
        additional_info,
        resume_text: trimText(input.resume_text) || "",
        source: input.source ?? "manual",
        applicant_state: trimText(input.applicant_state) === "Shortlisted"
            ? "Shortlisted"
            : trimText(input.applicant_state) === "Rejected"
                ? "Rejected"
                : trimText(input.applicant_state) === "Queued"
                    ? "Queued"
                    : "In Review",
        shortlisted: Boolean(input.shortlisted),
    };
}
export function parseDelimitedObjectList(value, fields) {
    return splitList(value).map((item) => {
        const parts = item.split("|").map((part) => part.trim());
        return Object.fromEntries(fields.map((field, index) => [field, parts[index] ?? ""]));
    });
}
//# sourceMappingURL=talentProfile.js.map