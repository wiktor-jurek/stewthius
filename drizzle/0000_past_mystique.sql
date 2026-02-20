CREATE TYPE "public"."creator_sentiment" AS ENUM('Positive', 'Neutral', 'Negative', 'Experimental');--> statement-breakpoint
CREATE TYPE "public"."ingredient_category" AS ENUM('Aromatic Veg', 'Root Veg', 'Leafy Green', 'Fruit', 'Protein-Poultry', 'Protein-RedMeat', 'Protein-Pork', 'Protein-Seafood', 'Starch-Potato', 'Starch-Grain', 'Starch-Legume', 'Herb', 'Spice', 'Fat', 'Acid', 'Liquid-Water', 'Liquid-Broth', 'Liquid-Dairy', 'Liquid-Wine', 'Other');--> statement-breakpoint
CREATE TYPE "public"."prep_style" AS ENUM('Raw', 'Roasted', 'Sautéed', 'Boiled', 'Leftover', 'Scrap', 'Jarred');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('unprocessed', 'analyzed', 'failed');--> statement-breakpoint
CREATE TABLE "ingredient_additions" (
	"addition_id" serial PRIMARY KEY NOT NULL,
	"analysis_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"prep_style" "prep_style" NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"ingredient_id" serial PRIMARY KEY NOT NULL,
	"ingredient_name" text NOT NULL,
	"ingredient_category" "ingredient_category" NOT NULL,
	CONSTRAINT "ingredients_ingredient_name_unique" UNIQUE("ingredient_name")
);
--> statement-breakpoint
CREATE TABLE "stew_analysis" (
	"analysis_id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"video_day" integer NOT NULL,
	"creator_sentiment" "creator_sentiment" NOT NULL,
	"rating_overall" numeric(3, 1),
	"rating_richness" numeric(3, 1),
	"rating_complexity" numeric(3, 1),
	"rating_overall_confidence" integer,
	"rating_richness_confidence" integer,
	"rating_complexity_confidence" integer,
	"flavor_profile_notes" text,
	"texture_thickness" numeric(3, 1),
	"appearance_color" text,
	"appearance_clarity" numeric(3, 1),
	"key_quote" text,
	"general_notes" text NOT NULL,
	"rating_inferred" boolean DEFAULT false NOT NULL,
	"richness_inferred" boolean DEFAULT false NOT NULL,
	"complexity_inferred" boolean DEFAULT false NOT NULL,
	"raw_gemini_response" text,
	"analysis_model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rating_overall_range" CHECK ("stew_analysis"."rating_overall" IS NULL OR ("stew_analysis"."rating_overall" >= 0 AND "stew_analysis"."rating_overall" <= 10)),
	CONSTRAINT "rating_richness_range" CHECK ("stew_analysis"."rating_richness" IS NULL OR ("stew_analysis"."rating_richness" >= 0 AND "stew_analysis"."rating_richness" <= 10)),
	CONSTRAINT "rating_complexity_range" CHECK ("stew_analysis"."rating_complexity" IS NULL OR ("stew_analysis"."rating_complexity" >= 0 AND "stew_analysis"."rating_complexity" <= 10)),
	CONSTRAINT "texture_thickness_range" CHECK ("stew_analysis"."texture_thickness" IS NULL OR ("stew_analysis"."texture_thickness" >= 0 AND "stew_analysis"."texture_thickness" <= 10)),
	CONSTRAINT "appearance_clarity_range" CHECK ("stew_analysis"."appearance_clarity" IS NULL OR ("stew_analysis"."appearance_clarity" >= 0 AND "stew_analysis"."appearance_clarity" <= 10))
);
--> statement-breakpoint
CREATE TABLE "video_summary_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"summary_text" text NOT NULL,
	"model" text NOT NULL,
	"dimensions" integer NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_transcripts" (
	"transcript_id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"model" text NOT NULL,
	"transcript_text" text NOT NULL,
	"language" varchar(16) DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"tiktok_url" varchar(500) NOT NULL,
	"video_id" varchar(100) NOT NULL,
	"title" text,
	"description" text,
	"author" varchar(100),
	"duration" integer,
	"view_count" bigint,
	"like_count" bigint,
	"comment_count" bigint,
	"share_count" bigint,
	"file_size" bigint,
	"b2_key" varchar(500),
	"is_about_stew" boolean,
	"processing_status" "processing_status" DEFAULT 'unprocessed' NOT NULL,
	"download_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ingredient_additions" ADD CONSTRAINT "ingredient_additions_analysis_id_stew_analysis_analysis_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."stew_analysis"("analysis_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_additions" ADD CONSTRAINT "ingredient_additions_ingredient_id_ingredients_ingredient_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("ingredient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stew_analysis" ADD CONSTRAINT "stew_analysis_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_summary_embeddings" ADD CONSTRAINT "video_summary_embeddings_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_transcripts" ADD CONSTRAINT "video_transcripts_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingredient_additions_analysis_idx" ON "ingredient_additions" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "ingredient_additions_ingredient_idx" ON "ingredient_additions" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stew_analysis_video_id_unique" ON "stew_analysis" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "stew_analysis_video_day_idx" ON "stew_analysis" USING btree ("video_day");--> statement-breakpoint
CREATE UNIQUE INDEX "video_summary_embeddings_video_id_unique" ON "video_summary_embeddings" USING btree ("video_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_transcripts_video_id_unique" ON "video_transcripts" USING btree ("video_id");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_tiktok_url_unique" ON "videos" USING btree ("tiktok_url");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_video_id_unique" ON "videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "videos_processing_status_idx" ON "videos" USING btree ("processing_status");