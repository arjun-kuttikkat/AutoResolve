ALTER TABLE "cases" ALTER COLUMN "mode" SET DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "mode" SET DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "cases" DROP COLUMN "confidence";