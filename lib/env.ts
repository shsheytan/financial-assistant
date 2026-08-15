import { z } from "zod";

/**
 * PUBLIC environment only. Safe to import from anywhere, including Client
 * Components — every value here is inlined into the browser bundle by design.
 *
 * Server secrets deliberately live in a separate module (lib/env.server.ts)
 * guarded by `server-only`. Keeping them here would compile the secret schema
 * into the client bundle: not a leak of the values, which Next strips, but it
 * does publish the list of services we authenticate against, and it removes the
 * one thing that turns "someone imported the wrong module" into a build error.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL must be a URL"),
});

export function formatEnvError(error: z.ZodError): string {
  const missing = error.issues.map((issue) => `  - ${issue.message}`).join("\n");
  return (
    `Environment is not configured:\n${missing}\n\n` +
    `Copy .env.example to .env.local and fill it in.`
  );
}

/**
 * Referenced by literal property name so Next can inline the values at build
 * time — `process.env[someVariable]` would not be replaced.
 */
const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  throw new Error(formatEnvError(parsed.error));
}

export const publicEnv = parsed.data;
