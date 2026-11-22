CREATE TABLE "question_reviews" (
	"question_id" uuid PRIMARY KEY NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"card" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "round_questions" ADD COLUMN "review" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_reviews_due_idx" ON "question_reviews" USING btree ("due");