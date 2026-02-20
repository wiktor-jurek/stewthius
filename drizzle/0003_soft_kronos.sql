CREATE TABLE IF NOT EXISTS "video_summary_embeddings" (
  "id" serial PRIMARY KEY NOT NULL,
  "video_id" integer NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "summary_text" text NOT NULL,
  "model" text NOT NULL,
  "dimensions" integer NOT NULL,
  "embedding" vector(768) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "video_summary_embeddings_video_id_unique"
  ON "video_summary_embeddings" USING btree ("video_id");
