import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001").transform(Number),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().default("http://localhost:3001/api/auth/gmail/callback"),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_PUBSUB_TOPIC: z.string().optional(),
  GOOGLE_PUBSUB_SUBSCRIPTION: z.string().optional(),
  GOOGLE_PUBSUB_AUDIENCE: z.string().optional(),
  GOOGLE_PUBSUB_VERIFICATION_ENABLED: z.string().optional().transform((v) => v === "true"),
  OPENAI_API_KEY: z.string().default(""),
  REPLY_MODEL: z.string().default("gpt-4o"),
  VALIDATOR_MODEL: z.string().default("gpt-4o-mini"),
  ENCRYPTION_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}
