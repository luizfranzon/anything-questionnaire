ALTER TABLE "questions" ADD COLUMN "difficulty" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "plan" jsonb;