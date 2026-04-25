import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config/env.js";
function extractFirstJsonObject(text) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
        return text.slice(first, last + 1);
    }
    return text;
}
export function hasGeminiConfig() {
    return Boolean(env.GOOGLE_API_KEY);
}
async function runGeminiPrompt(prompt) {
    if (!env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is missing");
    }
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
        model: env.GOOGLE_AI_MODEL || "gemini-2.0-flash",
    });
    const response = await model.generateContent(prompt);
    return response.response.text().trim();
}
export async function enrichScreeningNarratives(input) {
    if (!hasGeminiConfig() || input.candidates.length === 0) {
        return null;
    }
    const prompt = [
        "You are Talvo AI, an explainable recruiter copilot.",
        "Return ONLY valid JSON in this exact shape:",
        JSON.stringify({
            items: [
                {
                    candidate_id: "cand_001",
                    summary: "One-paragraph recruiter-friendly summary.",
                    strengths: ["..."],
                    gaps: ["..."],
                    recommendation: "Short recruiter-friendly recommendation",
                },
            ],
        }),
        "Keep summaries concise, grounded, and honest.",
        "",
        "JOB:",
        JSON.stringify(input.job, null, 2),
        "",
        "CANDIDATES:",
        JSON.stringify(input.candidates, null, 2),
    ].join("\n");
    try {
        const text = await runGeminiPrompt(prompt);
        const parsed = JSON.parse(extractFirstJsonObject(text));
        return Array.isArray(parsed.items) ? parsed.items : null;
    }
    catch (error) {
        console.error("Gemini screening enrichment failed:", error);
        return null;
    }
}
export async function askRecruiterAssistant(input) {
    if (!hasGeminiConfig()) {
        return {
            answer: "Gemini is not configured right now. Screening can still run with the deterministic engine, but recruiter chat needs GOOGLE_API_KEY.",
            suggestedNextQuestions: [
                "Who are the top candidates for this role?",
                "What are the biggest gaps in the shortlist?",
            ],
        };
    }
    const prompt = [
        "You are Talvo AI, a recruiter assistant.",
        "Answer clearly and practically. Do not hallucinate missing facts.",
        "Return ONLY valid JSON in this shape:",
        JSON.stringify({
            answer: "string",
            suggestedNextQuestions: ["string"],
        }),
        "",
        "JOB CONTEXT:",
        JSON.stringify(input.job ?? null, null, 2),
        "",
        "CANDIDATE CONTEXT:",
        JSON.stringify(input.candidates ?? [], null, 2),
        "",
        "SCREENING RESULTS:",
        JSON.stringify(input.results ?? [], null, 2),
        "",
        "USER QUESTION:",
        input.question,
    ].join("\n");
    try {
        const text = await runGeminiPrompt(prompt);
        const parsed = JSON.parse(extractFirstJsonObject(text));
        return {
            answer: typeof parsed.answer === "string" && parsed.answer.trim()
                ? parsed.answer.trim()
                : "I could not generate a grounded answer for that question.",
            suggestedNextQuestions: Array.isArray(parsed.suggestedNextQuestions)
                ? parsed.suggestedNextQuestions
                    .map((item) => String(item).trim())
                    .filter(Boolean)
                    .slice(0, 5)
                : [],
        };
    }
    catch (error) {
        console.error("Gemini recruiter assistant failed:", error);
        return {
            answer: "I hit a problem while generating the recruiter answer. Please try again in a moment.",
            suggestedNextQuestions: [],
        };
    }
}
//# sourceMappingURL=gemini.js.map