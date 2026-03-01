import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Environment variable validation.
 *
 * Add every required env var here. The app will fail fast at startup
 * if any value is missing or invalid -- no silent runtime surprises.
 *
 * To add a new env var:
 *   1. Add it to the schema below
 *   2. Add it to .env.example with a placeholder value
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
