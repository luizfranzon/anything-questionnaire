CREATE TABLE "model_prices" (
	"model" text PRIMARY KEY NOT NULL,
	"input" double precision NOT NULL,
	"output" double precision NOT NULL,
	"cache_read" double precision NOT NULL,
	"cache_write" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_models" (
	"stage" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL
);
