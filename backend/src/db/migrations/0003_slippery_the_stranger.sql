CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"case_reference_id" varchar(32) NOT NULL,
	"merchant_name" varchar(255),
	"issue_description" text,
	"desired_outcome" text,
	"status" varchar(32) DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "case_id" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cases_user_ref_idx" ON "cases" USING btree ("user_id","case_reference_id");--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;