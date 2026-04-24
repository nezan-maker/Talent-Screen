import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";
import { geminiOutputSchema } from "../validations/functionValidations.js";
import { z } from "zod";
function extractFirstJsonObject(text) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last >= 0 && last > first)
        return text.slice(first, last + 1);
    return text;
}
async function generateWithGemini(opts) {
    if (opts.provider === "ai-studio") {
        const genAI = new GoogleGenerativeAI(opts.apiKey);
        const tryModels = [
            opts.model,
            "gemini-flash-latest",
            "gemini-2.0-flash",
        ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);
        let lastErr = undefined;
        for (const m of tryModels) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent(opts.prompt);
                return result.response.text().trim();
            }
            catch (e) {
                lastErr = e;
                const status = typeof e?.status === "number" ? e.status : undefined;
                const msg = typeof e?.message === "string" ? e.message : "";
                // Only fallback on model-not-found style failures
                if (status === 404 ||
                    msg.includes("not found") ||
                    msg.includes("ListModels"))
                    continue;
                throw e;
            }
        }
        throw lastErr;
    }
    const vertex = new VertexAI({
        project: opts.projectId,
        location: opts.location,
    });
    const model = vertex.getGenerativeModel({ model: opts.model });
    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: opts.prompt }],
            },
        ],
    });
    const text = result.response.candidates?.[0]?.content?.parts
        ?.map((p) => (typeof p?.text === "string" ? p.text : ""))
        .join("") ?? "";
    return text.trim();
}
export async function screenWithGemini(opts) {
    // Keep resumes short to avoid huge prompts; still keep enough signal.
    const candidatesCompact = opts.candidates.map((c) => ({
        applicantId: c.applicant_id,
        fullName: c.applicant_name,
        email: c.applicant_email,
        location: c.location,
        skills: c.skills ?? [],
        yearsExperience: c.experience,
        education: c.education ?? [],
        languages: c.languages,
        projects: c.projects,
        certifications: c.certifications,
        availability: c.availability,
        social_links: c.social_links,
    }));
    const prompt = [
        "You are an AI assistant helping a recruiter screen candidates.",
        "Goal: rank and shortlist candidates for the given job, while preserving human-led final decisions.",
        "",
        "Requirements:",
        `- Return ONLY valid JSON with this shape: ${JSON.stringify({ shortlist: [{ applicantId: "id", rank: 1, matchScore: 85, strengths: ["..."], gaps: ["..."], recommendation: "..." }] })}`,
        `- Provide exactly topK=${opts.topK} items unless fewer candidates exist.`,
        "- matchScore must be 0..100.",
        "- strengths and gaps must be concise bullet-like strings.",
        "- recommendation must be recruiter-friendly and action-oriented (e.g. 'Strong interview', 'Proceed with caution', 'Not recommended').",
        "- Be transparent: note missing information as gaps/risks.",
        "",
        "Scoring guidance (suggested weights): skills 40%, experience 30%, education 10%, overall relevance 20%.",
        "",
        "JOB:",
        JSON.stringify(opts.job, null, 2),
        "",
        "CANDIDATES:",
        JSON.stringify(candidatesCompact, null, 2),
    ].join("\n");
    const text = await generateWithGemini({ ...opts, prompt });
    const jsonText = extractFirstJsonObject(text);
    const parsed = JSON.parse(jsonText);
    const data = geminiOutputSchema.parse(parsed);
    // Normalize ranks (ensure 1..N and stable order)
    const sorted = [...data.shortlist]
        .sort((a, b) => a.rank - b.rank)
        .map((x, i) => ({ ...x, rank: i + 1 }));
    return { shortlist: sorted };
}
const assistantOutputSchema = z.object({
    answer: z.string().min(1),
    suggestedNextQuestions: z.array(z.string().min(1)).default([]),
});
export async function assistantWithGemini(opts) {
    const candidatesCompact = (opts.candidates ?? []).map((c) => ({
        applicantId: c.applicant_id,
        fullName: c.applicant_name,
        email: c.applicant_email,
        location: c.location,
        skills: c.skills ?? [],
        yearsExperience: c.experience,
        education: c.education ?? [],
        languages: c.languages,
        projects: c.projects,
        certifications: c.certifications,
        availability: c.availability,
        social_links: c.social_links,
    }));
    const prompt = [
        "You are an AI assistant helping a recruiter. Be concise, practical, and recruiter-friendly.",
        "Do not hallucinate. If information is missing, say what is missing and what to ask/collect next.",
        "",
        "Output requirements:",
        `- Return ONLY valid JSON with this shape: ${JSON.stringify({ answer: "string", suggestedNextQuestions: ["..."] })}`,
        "- suggestedNextQuestions should be 0-5 short questions.",
        "",
        opts.job
            ? "JOB CONTEXT:\n" + JSON.stringify(opts.job, null, 2)
            : "JOB CONTEXT: (not provided)",
        "",
        candidatesCompact.length
            ? "CANDIDATES CONTEXT:\n" + JSON.stringify(candidatesCompact, null, 2)
            : "CANDIDATES CONTEXT: (not provided)",
        "",
        "USER QUESTION:",
        opts.question,
    ].join("\n");
    const text = await generateWithGemini({ ...opts, prompt });
    const jsonText = extractFirstJsonObject(text);
    const parsed = JSON.parse(jsonText);
    return assistantOutputSchema.parse(parsed);
}
//# sourceMappingURL=gemini.js.map