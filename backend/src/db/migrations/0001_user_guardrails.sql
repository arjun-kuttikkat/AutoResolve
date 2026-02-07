-- Guardrails: when to trigger and how to adjust replies
CREATE TABLE IF NOT EXISTS "user_guardrails" (
  "user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "trigger_description" text,
  "reply_instructions" text,
  "updated_at" timestamp with time zone DEFAULT now()
);
