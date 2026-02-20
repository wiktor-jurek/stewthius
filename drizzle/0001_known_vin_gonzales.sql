ALTER TABLE "stew_analysis" ALTER COLUMN "creator_sentiment" SET DATA TYPE text;--> statement-breakpoint
UPDATE "stew_analysis" SET "creator_sentiment" = 'Neutral' WHERE "creator_sentiment" = 'Experimental';--> statement-breakpoint
DROP TYPE "public"."creator_sentiment";--> statement-breakpoint
CREATE TYPE "public"."creator_sentiment" AS ENUM('Super Positive', 'Positive', 'Neutral', 'Negative', 'Super Negative');--> statement-breakpoint
ALTER TABLE "stew_analysis" ALTER COLUMN "creator_sentiment" SET DATA TYPE "public"."creator_sentiment" USING "creator_sentiment"::"public"."creator_sentiment";