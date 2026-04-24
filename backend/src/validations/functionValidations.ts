import z from "zod";
export const askSchema = z.object({
  job_id: z.string().min(1).optional(),
  applicant_ids: z.array(z.string().min(1)).optional(),
  max_applicants: z.number().int().min(1).max(200).default(50),
  question: z.string().min(1).max(4000),
});
export const geminiOutputSchema = z.object({
  shortlist: z
    .array(
      z.object({
        applicant_id: z.string().min(1),
        rank: z.number().int().min(1),
        match_score: z.number().min(0).max(100),
        strengths: z.array(z.string()).default([]),
        gaps: z.array(z.string()).default([]),
        recommendation: z.string().min(1),
      }),
    )
    .min(1),
});
export const triggerSchema = z.object({
  job_id: z.string().min(1),
  applicant_ids: z.array(z.string().min(1)).optional(),
  topK: z.number().int().min(1).max(50).default(10),
});
