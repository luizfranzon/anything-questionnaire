CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"response" text,
	"outcome" text NOT NULL,
	"confidence" text,
	"answered_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"format" text NOT NULL,
	"prompt" text NOT NULL,
	"alternatives" jsonb NOT NULL,
	"answer_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round_questions" (
	"round_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "round_questions_round_id_question_id_pk" PRIMARY KEY("round_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"count" integer NOT NULL,
	"topic_ids" jsonb,
	"status" text DEFAULT 'generating' NOT NULL,
	"job_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "round_id" uuid;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_questions" ADD CONSTRAINT "round_questions_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_questions" ADD CONSTRAINT "round_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "answers_round_question_unique" ON "answers" USING btree ("round_id","question_id");--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE set null ON UPDATE no action;