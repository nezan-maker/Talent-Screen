import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  // Add other env vars as needed
});

export const env = envSchema.parse(process.env);