ALTER TABLE "usage_records" ALTER COLUMN "cache_read_tokens" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_records" ALTER COLUMN "cache_write_tokens" DROP NOT NULL;