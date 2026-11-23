CREATE TABLE "credentials" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"method" text NOT NULL,
	"secret" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
