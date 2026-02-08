-- AutoResolve MVP schema
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255),
  "last_history_id" varchar(64),
  "watch_enabled" boolean DEFAULT false,
  "watch_expires_at" timestamp with time zone,
  "mode" varchar(32) DEFAULT 'approval',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "oauth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "scope" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "email_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "thread_id" varchar(64) NOT NULL,
  "subject" varchar(1024),
  "last_processed_message_id" varchar(64),
  "status" varchar(32) DEFAULT 'pending',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  UNIQUE("user_id", "thread_id")
);

CREATE TABLE IF NOT EXISTS "emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" uuid NOT NULL REFERENCES "email_threads"("id") ON DELETE CASCADE,
  "message_id" varchar(64) NOT NULL UNIQUE,
  "rfc_message_id" varchar(512),
  "from_email" varchar(512) NOT NULL,
  "to_email" varchar(512) NOT NULL,
  "subject" varchar(1024),
  "body" text,
  "is_from_user" boolean NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "email_replies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email_id" uuid NOT NULL REFERENCES "emails"("id") ON DELETE CASCADE,
  "thread_id" uuid NOT NULL REFERENCES "email_threads"("id") ON DELETE CASCADE,
  "inbound_message_id" varchar(64) NOT NULL,
  "generated_content" text NOT NULL,
  "provider_message_id" varchar(64),
  "status" varchar(32) DEFAULT 'draft',
  "error" text,
  "confidence_score" integer,
  "safety_check_passed" boolean,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  UNIQUE("user_id", "inbound_message_id")
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "email_threads_user_thread_idx" ON "email_threads" ("user_id", "thread_id");
CREATE INDEX IF NOT EXISTS "emails_message_id_idx" ON "emails" ("message_id");
CREATE INDEX IF NOT EXISTS "email_replies_user_inbound_idx" ON "email_replies" ("user_id", "inbound_message_id");
