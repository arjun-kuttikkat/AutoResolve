ALTER TABLE "cases" ADD COLUMN "mode" varchar(32) DEFAULT 'approval';--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "confidence" integer;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "next_action" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "last_action" text;