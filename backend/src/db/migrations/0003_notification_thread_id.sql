-- Add thread_id so notifications can link to a Gmail thread (e.g. human_intervention)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "thread_id" varchar(64);
