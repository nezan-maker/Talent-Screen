import { Router } from "express";
import { z } from "zod";
import Applicant from "../models/Applicant.js";
import { AssistantConversationModel } from "../models/AssistantConversation.js";
import Job from "../models/Job.js";
import { buildEntityId } from "../utils/ids.js";
import { askRecruiterAssistant, } from "../lib/gemini.js";
import { inferExperienceYears, normalizeEducation, normalizeExperience, normalizeSkills, parseJobCriteria, splitList, trimText, } from "../utils/talentProfile.js";
const askSchema = z.object({
    conversationId: z.string().min(1).optional(),
    jobId: z.string().min(1).optional(),
    applicantIds: z.array(z.string().min(1)).optional(),
    maxApplicants: z.number().int().min(1).max(200).default(50),
    question: z.string().min(1).max(4000),
});
function createConversationTitle(question) {
    return trimText(question).slice(0, 42) || "New chat";
}
function mapConversation(conversation) {
    return {
        id: trimText(conversation?._id),
        title: trimText(conversation?.title) || "New chat",
        updatedAtISO: new Date(conversation?.updatedAt ?? Date.now()).toISOString(),
        followUps: Array.isArray(conversation?.follow_ups)
            ? conversation.follow_ups.map((item) => trimText(item)).filter(Boolean)
            : [],
        messages: Array.isArray(conversation?.messages)
            ? conversation.messages.map((message) => ({
                id: trimText(message?.id) || buildEntityId("msg"),
                role: trimText(message?.role) === "user" ? "user" : "assistant",
                text: trimText(message?.text),
                createdAtISO: new Date(message?.created_at ?? Date.now()).toISOString(),
            }))
            : [],
    };
}
function parseYearsFromText(value) {
    const match = trimText(value).match(/(\d+)\+?\s*years?/i);
    if (!match) {
        return undefined;
    }
    const years = Number(match[1]);
    return Number.isFinite(years) ? years : undefined;
}
function mapJob(job) {
    const criteria = parseJobCriteria(job?.job_ai_criteria);
    const skills = criteria.map((item) => trimText(item.criteria_string)).filter(Boolean);
    const requirements = splitList([job?.job_qualifications, job?.job_responsibilities, job?.job_description]
        .map((item) => trimText(item))
        .filter(Boolean)
        .join("\n"));
    const education = splitList(job?.job_qualifications);
    const notes = trimText(job?.job_description);
    const experienceYearsMin = parseYearsFromText(job?.job_experience_required);
    return {
        jobId: trimText(job?._id),
        title: trimText(job?.job_title) || "Role",
        requirements,
        skills,
        minimum_marks: typeof job?.minimum_marks === "number" ? job.minimum_marks : 70,
        ...(typeof experienceYearsMin === "number" ? { experienceYearsMin } : {}),
        education,
        ...(notes ? { notes } : {}),
    };
}
function mapCandidate(candidate, index) {
    const skills = normalizeSkills(candidate?.skills)
        .map((item) => trimText(item.name))
        .filter(Boolean);
    const experience = normalizeExperience(candidate?.experience);
    const yearsExperience = inferExperienceYears(experience);
    const education = normalizeEducation(candidate?.education).map((item) => [trimText(item.degree), trimText(item.field_of_study), trimText(item.institution)]
        .filter(Boolean)
        .join(" - "));
    const email = trimText(candidate?.applicant_email ?? candidate?.email);
    const location = trimText(candidate?.location);
    const fullName = trimText(candidate?.applicant_name);
    const resumeText = trimText(candidate?.resume_text);
    const applicantId = trimText(candidate?._id) || `candidate_${index + 1}`;
    return {
        applicantId,
        ...(fullName ? { fullName } : {}),
        ...(email ? { email } : {}),
        ...(location ? { location } : {}),
        ...(skills.length > 0 ? { skills } : {}),
        ...(yearsExperience > 0 ? { yearsExperience } : {}),
        ...(education.length > 0 ? { education } : {}),
        ...(resumeText ? { resumeText } : {}),
    };
}
export default function assistantRouter(options = {}) {
    const router = Router();
    router.get("/conversations", async (req, res) => {
        try {
            if (!req.currentUserId) {
                return res.status(401).json({ user_error: "Not authenticated" });
            }
            const conversations = await AssistantConversationModel.find({
                user_id: req.currentUserId,
            })
                .sort({ updatedAt: -1 })
                .lean();
            return res.status(200).json({
                conversations: conversations.map(mapConversation),
            });
        }
        catch (error) {
            console.error("Error in assistant /conversations route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    router.post("/ask", async (req, res) => {
        try {
            if (!req.currentUserId) {
                return res.status(401).json({ user_error: "Not authenticated" });
            }
            const input = askSchema.parse(req.body);
            const job = input.jobId ? await Job.findById(input.jobId).lean() : null;
            if (input.jobId && (!job || trimText(job.user_id) !== req.currentUserId)) {
                return res.status(404).json({ data_error: "Job not found" });
            }
            const applicantQuery = input.applicantIds?.length
                ? { _id: { $in: input.applicantIds }, user_id: req.currentUserId }
                : job
                    ? {
                        user_id: req.currentUserId,
                        $or: [
                            { job_id: trimText(job._id) },
                            { job_title: trimText(job.job_title) },
                        ],
                    }
                    : { user_id: req.currentUserId };
            const applicants = await Applicant.find(applicantQuery)
                .limit(input.maxApplicants)
                .lean();
            const mappedJob = job ? mapJob(job) : undefined;
            const mappedApplicants = applicants.length > 0
                ? applicants.map((applicant, index) => mapCandidate(applicant, index))
                : [];
            const reply = await askRecruiterAssistant({
                question: input.question,
                ...(mappedJob ? { job: mappedJob } : {}),
                ...(mappedApplicants.length > 0
                    ? { candidates: mappedApplicants }
                    : {}),
            });
            const now = new Date();
            const conversationId = trimText(input.conversationId);
            const userMessage = {
                id: buildEntityId("msg"),
                role: "user",
                text: trimText(input.question),
                created_at: now,
            };
            const assistantMessage = {
                id: buildEntityId("msg"),
                role: "assistant",
                text: trimText(reply.answer),
                created_at: new Date(),
            };
            const existingConversation = conversationId
                ? await AssistantConversationModel.findOne({
                    _id: conversationId,
                    user_id: req.currentUserId,
                })
                : null;
            const conversation = existingConversation
                ? existingConversation
                : new AssistantConversationModel({
                    user_id: req.currentUserId,
                    title: createConversationTitle(input.question),
                    follow_ups: [],
                    messages: [],
                });
            if (!trimText(conversation.title)) {
                conversation.title = createConversationTitle(input.question);
            }
            conversation.messages.push(userMessage, assistantMessage);
            conversation.follow_ups = reply.suggestedNextQuestions
                .map((item) => trimText(item))
                .filter(Boolean);
            await conversation.save();
            return res.status(200).json({
                answer: reply.answer,
                suggestedNextQuestions: reply.suggestedNextQuestions,
                conversation: mapConversation(conversation),
                context: {
                    jobId: input.jobId ?? null,
                    applicantCount: applicants.length,
                },
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ input_error: "Input requirements not fulfilled" });
            }
            console.error("Error in assistant /ask route:", error);
            return res.status(500).json({ server_error: "Internal server error" });
        }
    });
    return router;
}
//# sourceMappingURL=assistant.js.map