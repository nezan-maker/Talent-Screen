import { normalizeAvailability, normalizeEducation, normalizeExperience, normalizeLanguages, normalizeSkills, normalizeSocialLinks, splitList, trimText, } from "./talentProfile.js";
function normalizeComparableText(value) {
    return trimText(value)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function normalizeHeaderKey(value) {
    return normalizeComparableText(value).replace(/\s+/g, "");
}
function levenshteinDistance(left, right) {
    if (left === right) {
        return 0;
    }
    if (!left.length) {
        return right.length;
    }
    if (!right.length) {
        return left.length;
    }
    const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
    for (let i = 0; i <= left.length; i += 1) {
        const row = matrix[i];
        if (row) {
            row[0] = i;
        }
    }
    for (let j = 0; j <= right.length; j += 1) {
        const firstRow = matrix[0];
        if (firstRow) {
            firstRow[j] = j;
        }
    }
    for (let i = 1; i <= left.length; i += 1) {
        for (let j = 1; j <= right.length; j += 1) {
            const cost = left[i - 1] === right[j - 1] ? 0 : 1;
            const row = matrix[i];
            const previousRow = matrix[i - 1];
            if (!row || !previousRow) {
                continue;
            }
            row[j] = Math.min((previousRow[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (previousRow[j - 1] ?? 0) + cost);
        }
    }
    return matrix[left.length]?.[right.length] ?? Math.max(left.length, right.length);
}
function similarityScore(left, right) {
    if (!left || !right) {
        return 0;
    }
    if (left === right) {
        return 1;
    }
    if (left.includes(right) || right.includes(left)) {
        return 0.96;
    }
    const leftTokens = new Set(normalizeComparableText(left).split(" ").filter(Boolean));
    const rightTokens = new Set(normalizeComparableText(right).split(" ").filter(Boolean));
    const overlap = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
    const tokenScore = overlap === 0 ? 0 : overlap / Math.max(leftTokens.size, rightTokens.size, 1);
    const distance = levenshteinDistance(normalizeHeaderKey(left), normalizeHeaderKey(right));
    const maxLength = Math.max(normalizeHeaderKey(left).length, normalizeHeaderKey(right).length, 1);
    const editScore = 1 - (distance ?? maxLength) / maxLength;
    return Math.max(tokenScore, editScore);
}
function normalizeUrl(value) {
    const text = trimText(value).replace(/[),.;]+$/g, "");
    if (!text) {
        return "";
    }
    if (/^[a-z]+:\/\//i.test(text) || /^mailto:/i.test(text)) {
        return text;
    }
    if (/^(linkedin\.com|github\.com|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(text)) {
        return `https://${text}`;
    }
    return text;
}
function normalizeEmail(value) {
    const match = trimText(value)
        .replace(/\s+/g, "")
        .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0].toLowerCase() : "";
}
function uniqueStrings(values) {
    return Array.from(new Set(values.map((item) => trimText(item)).filter(Boolean)));
}
export function extractCellText(value) {
    if (value == null) {
        return "";
    }
    if (typeof value === "string") {
        return trimText(value);
    }
    if (typeof value === "number" || typeof value === "boolean" || value instanceof Date) {
        return trimText(value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => extractCellText(item)).filter(Boolean).join(" ").trim();
    }
    if (typeof value === "object") {
        const record = value;
        const richText = Array.isArray(record.richText)
            ? record.richText
            : Array.isArray(record.text?.richText)
                ? record.text.richText
                : [];
        if (richText.length > 0) {
            return richText
                .map((item) => trimText(item.text))
                .filter(Boolean)
                .join("")
                .trim();
        }
        const candidates = [
            record.text,
            record.result,
            record.hyperlink,
            record.value,
            record.formula,
        ]
            .map((item) => (typeof item === "string" ? trimText(item) : ""))
            .filter(Boolean);
        if (candidates.length > 0) {
            return candidates[0] ?? "";
        }
    }
    return trimText(value);
}
export function extractLinksFromText(value) {
    const text = extractCellText(value);
    if (!text) {
        return { linkedin: "", github: "", portfolio: "", all: [] };
    }
    const rawLinks = text.match(/(?:https?:\/\/[^\s,;|)]+|www\.[^\s,;|)]+|linkedin\.com\/[^\s,;|)]+|github\.com\/[^\s,;|)]+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,6}(?:\/[^\s,;|)]*)?)/gi) ?? [];
    const all = uniqueStrings(rawLinks
        .map((item) => normalizeUrl(item))
        .filter((item) => !item.includes("@")));
    const linkedin = all.find((item) => item.toLowerCase().includes("linkedin.com")) || "";
    const github = all.find((item) => item.toLowerCase().includes("github.com")) || "";
    const portfolio = all.find((item) => !item.toLowerCase().includes("linkedin.com") &&
        !item.toLowerCase().includes("github.com") &&
        !item.toLowerCase().startsWith("mailto:")) || "";
    return { linkedin, github, portfolio, all };
}
export function extractEmailFromText(value) {
    return normalizeEmail(extractCellText(value));
}
export function pickBestRecordValue(record, aliases, options) {
    const minimumScore = options?.minimumScore ?? 0.8;
    const normalizedAliases = aliases.map((alias) => normalizeHeaderKey(alias));
    for (const [rawKey, rawValue] of Object.entries(record)) {
        const normalizedKey = normalizeHeaderKey(rawKey);
        if (normalizedAliases.includes(normalizedKey)) {
            return extractCellText(rawValue);
        }
    }
    let bestValue;
    let bestScore = 0;
    for (const [rawKey, rawValue] of Object.entries(record)) {
        const key = extractCellText(rawKey);
        if (!key) {
            continue;
        }
        for (const alias of aliases) {
            const score = similarityScore(key, alias);
            if (score > bestScore) {
                bestScore = score;
                bestValue = extractCellText(rawValue);
            }
        }
    }
    return bestScore >= minimumScore ? trimText(bestValue) : "";
}
function sectionIndexes(lines) {
    const headings = new Map();
    lines.forEach((line, index) => {
        const normalized = normalizeComparableText(line).toUpperCase();
        const key = normalized.replace(/\s+/g, " ").trim();
        if (key === "PROFESSIONAL SUMMARY" ||
            key === "SUMMARY" ||
            key === "EXPERIENCE" ||
            key === "SKILLS" ||
            key === "EDUCATION" ||
            key === "CERTIFICATIONS" ||
            key === "PROJECTS" ||
            key === "LANGUAGES" ||
            key === "PUBLICATIONS" ||
            key === "ADDITIONAL") {
            headings.set(key, index);
        }
    });
    return headings;
}
function sectionText(lines, headings, name) {
    const start = headings.get(name);
    if (typeof start !== "number") {
        return "";
    }
    const nextIndexes = Array.from(headings.values()).filter((index) => index > start);
    const end = nextIndexes.length > 0 ? Math.min(...nextIndexes) : lines.length;
    return lines.slice(start + 1, end).join("\n").trim();
}
function parseSkillsSection(text) {
    if (!text) {
        return [];
    }
    const parts = text
        .split(/\n+/)
        .flatMap((line) => {
        const cleaned = line.replace(/^[A-Za-z ]+:\s*/g, "");
        return splitList(cleaned);
    })
        .map((item) => item.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 60);
    return normalizeSkills(parts.map((item) => ({ name: item })));
}
function parseEducationSection(text) {
    if (!text) {
        return [];
    }
    const entries = text
        .split(/\n+/)
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .map((line) => {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
        const [degreePart, institutionPart] = line.split(/—| - /).map((item) => item.trim());
        return {
            degree: degreePart || line,
            institution: institutionPart || "",
            end_year: yearMatch?.length ? Number(yearMatch[yearMatch.length - 1]) : null,
        };
    });
    return normalizeEducation(entries);
}
function parseExperienceSection(text) {
    if (!text) {
        return [];
    }
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const entries = [];
    let index = 0;
    while (index < lines.length) {
        const roleLine = lines[index];
        if (!roleLine || /^[•*-]/.test(roleLine)) {
            index += 1;
            continue;
        }
        const detailLine = lines[index + 1] ?? "";
        if (!detailLine.includes("|") && !/\b(19|20)\d{2}\b/.test(detailLine)) {
            index += 1;
            continue;
        }
        const detailParts = detailLine.split("|").map((part) => part.trim()).filter(Boolean);
        const company = detailParts[0] ?? "";
        const datePart = detailParts.slice(1).join(" | ");
        const years = datePart.match(/((?:19|20)\d{2})\s*[–-]\s*(present|current|(?:19|20)\d{2})/i);
        const bulletLines = [];
        index += 2;
        while (index < lines.length) {
            const line = lines[index];
            if (!line) {
                index += 1;
                continue;
            }
            if (!/^[•*-]/.test(line) && (lines[index + 1]?.includes("|") || /\b(19|20)\d{2}\b/.test(lines[index + 1] ?? ""))) {
                break;
            }
            bulletLines.push(line.replace(/^[•*-]\s*/, "").trim());
            index += 1;
        }
        const technologies = uniqueStrings(bulletLines.flatMap((line) => {
            const segments = line.split(/[;,:]/).slice(1);
            return segments.flatMap((segment) => splitList(segment));
        }));
        entries.push({
            role: roleLine,
            company,
            start_date: years?.[1] ?? "",
            end_date: years?.[2] ?? "",
            is_current: /present|current/i.test(years?.[2] ?? ""),
            description: bulletLines.join(" "),
            technologies,
        });
    }
    return normalizeExperience(entries);
}
function parseAvailability(text) {
    const normalized = trimText(text);
    if (!normalized) {
        return undefined;
    }
    if (/available immediately/i.test(normalized)) {
        return normalizeAvailability({
            status: "Immediately Available",
            type: "Full-time",
            start_date: null,
        });
    }
    const quarter = normalized.match(/available\s+(q[1-4]\s+\d{4})/i);
    if (quarter) {
        return normalizeAvailability({
            status: "Open to Opportunities",
            type: "Full-time",
            start_date: quarter[1]?.toUpperCase() || null,
        });
    }
    return undefined;
}
export function parseResumeHeuristics(text) {
    const cleaned = trimText(text)
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^-+\s*\d+\s+of\s+\d+\s*-+$/gim, "");
    if (!cleaned) {
        return {};
    }
    const lines = cleaned
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => Boolean(line) && !/^-+\s*\d+\s+of\s+\d+\s*-+$/i.test(line));
    const headings = sectionIndexes(lines);
    const topLines = lines.slice(0, Math.min(lines.length, 6));
    const topBlock = topLines.join(" | ");
    const topTokens = topBlock
        .split(/[|·]/)
        .map((token) => token.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    const summaryText = sectionText(lines, headings, "PROFESSIONAL SUMMARY") || sectionText(lines, headings, "SUMMARY");
    const skillsText = sectionText(lines, headings, "SKILLS");
    const experienceText = sectionText(lines, headings, "EXPERIENCE");
    const educationText = sectionText(lines, headings, "EDUCATION");
    const additionalText = sectionText(lines, headings, "ADDITIONAL");
    const languagesText = sectionText(lines, headings, "LANGUAGES");
    const email = extractEmailFromText(topBlock) || extractEmailFromText(cleaned);
    const links = extractLinksFromText(topBlock);
    const allLinks = extractLinksFromText(cleaned);
    const topLinkedin = topTokens.find((token) => token.toLowerCase().includes("linkedin.com")) || "";
    const topGithub = topTokens.find((token) => token.toLowerCase().includes("github.com")) || "";
    const topPortfolio = topTokens.find((token) => /\.[a-z]{2,6}(?:\/.*)?$/i.test(token) &&
        !token.includes("@") &&
        !token.toLowerCase().includes("linkedin.com") &&
        !token.toLowerCase().includes("github.com") &&
        token.split(/\s+/).length <= 2) || "";
    const locationLine = topTokens.find((token) => !/@/.test(token) &&
        token.split(/\s+/).length <= 8 &&
        (/utc/i.test(token) || /,\s*[A-Za-z]/.test(token) || /\bremote\b/i.test(token))) || "";
    const yearsMatch = cleaned.match(/(\d{1,2})\+?\s*(?:years|yrs)\b/i);
    const yearsExperience = yearsMatch ? Number(yearsMatch[1]) : undefined;
    const availability = parseAvailability(additionalText || cleaned);
    const additionalInfo = uniqueStrings([
        ...splitList(additionalText.replace(/\n/g, ", ")),
        ...(availability?.status ? [availability.status] : []),
        ...(availability?.start_date ? [availability.start_date] : []),
    ]);
    return {
        applicant_name: lines[0] || "",
        headline: lines[1] && !/summary|experience|skills|education/i.test(lines[1]) ? lines[1] : "",
        bio: summaryText || "",
        email,
        location: locationLine,
        skills: parseSkillsSection(skillsText),
        languages: normalizeLanguages(splitList(languagesText)),
        experience: parseExperienceSection(experienceText),
        education: parseEducationSection(educationText),
        social_links: normalizeSocialLinks({
            linkedin: normalizeUrl(topLinkedin) || links.linkedin || allLinks.linkedin,
            github: normalizeUrl(topGithub) || links.github || allLinks.github,
            portfolio: normalizeUrl(topPortfolio) || links.portfolio || allLinks.portfolio,
        }),
        additional_info: additionalInfo,
        ...(availability ? { availability } : {}),
        ...(typeof yearsExperience === "number" ? { experience_in_years: yearsExperience } : {}),
    };
}
//# sourceMappingURL=applicantParsing.js.map