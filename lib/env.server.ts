// Importing this module from a Client Component is a BUILD ERROR, not a
// runtime one. That is the point: Next already strips non-NEXT_PUBLIC values
// from the browser bundle, but stripping is silent — you find out you made a
// mistake when something is mysteriously undefined in production. This fails
// loudly at compile time instead.
import "server-only";

import { z } from "zod";
import { formatEnvError } from "./env";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
});

let cached: z.infer<typeof serverSchema> | null = null;

/**
 * Server-only secrets.
 *
 * Validated lazily on first use rather than at module load, so that a missing
 * GEMINI_API_KEY does not stop the whole app from booting when nothing has
 * asked for AI yet — M1 and M2 need to run without those keys.
 */
export function serverEnv(): z.infer<typeof serverSchema> {
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  });

  if (!parsed.success) {
    throw new Error(formatEnvError(parsed.error));
  }

  cached = parsed.data;
  return cached;
}
