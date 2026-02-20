CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'creator_sentiment') THEN
    CREATE TYPE creator_sentiment AS ENUM ('Positive', 'Neutral', 'Negative', 'Experimental');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status') THEN
    CREATE TYPE processing_status AS ENUM ('unprocessed', 'processed', 'failed', 'embedded');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transcript_status') THEN
    CREATE TYPE transcript_status AS ENUM ('pending', 'completed', 'failed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'embedding_status') THEN
    CREATE TYPE embedding_status AS ENUM ('pending', 'completed', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  tiktok_url VARCHAR(500) UNIQUE NOT NULL,
  video_id VARCHAR(100) NOT NULL,
  title TEXT,
  description TEXT,
  author VARCHAR(100),
  duration INTEGER,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  file_path VARCHAR(500),
  file_size BIGINT,
  transcript_text TEXT,
  processing_status processing_status NOT NULL DEFAULT 'unprocessed',
  download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS videos
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS videos
  ADD COLUMN IF NOT EXISTS transcript_text TEXT;

ALTER TABLE IF EXISTS videos
  ALTER COLUMN processing_status TYPE processing_status
  USING processing_status::processing_status;

ALTER TABLE IF EXISTS videos
  ALTER COLUMN processing_status SET DEFAULT 'unprocessed';

CREATE UNIQUE INDEX IF NOT EXISTS videos_tiktok_url_unique ON videos (tiktok_url);
CREATE UNIQUE INDEX IF NOT EXISTS videos_video_id_unique ON videos (video_id);
CREATE INDEX IF NOT EXISTS videos_processing_status_idx ON videos (processing_status);

DO $$
BEGIN
  IF to_regclass('public.stewanalysis') IS NOT NULL AND to_regclass('public.stew_analysis') IS NULL THEN
    ALTER TABLE stewanalysis RENAME TO stew_analysis;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stew_analysis (
  analysis_id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  video_day INTEGER NOT NULL,
  creator_sentiment creator_sentiment NOT NULL,
  rating_overall DECIMAL(3, 1),
  rating_richness DECIMAL(3, 1),
  rating_complexity DECIMAL(3, 1),
  flavor_profile_notes TEXT,
  texture_thickness DECIMAL(3, 1),
  appearance_color TEXT,
  appearance_clarity DECIMAL(3, 1),
  key_quote TEXT,
  general_notes TEXT NOT NULL,
  rating_inferred BOOLEAN NOT NULL DEFAULT FALSE,
  richness_inferred BOOLEAN NOT NULL DEFAULT FALSE,
  complexity_inferred BOOLEAN NOT NULL DEFAULT FALSE,
  raw_gemini_response TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'analysisid') THEN
    ALTER TABLE stew_analysis RENAME COLUMN analysisid TO analysis_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'videoid') THEN
    ALTER TABLE stew_analysis RENAME COLUMN videoid TO video_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'videoday') THEN
    ALTER TABLE stew_analysis RENAME COLUMN videoday TO video_day;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'creatorsentiment') THEN
    ALTER TABLE stew_analysis RENAME COLUMN creatorsentiment TO creator_sentiment;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'ratingoverall') THEN
    ALTER TABLE stew_analysis RENAME COLUMN ratingoverall TO rating_overall;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'ratingrichness') THEN
    ALTER TABLE stew_analysis RENAME COLUMN ratingrichness TO rating_richness;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'ratingcomplexity') THEN
    ALTER TABLE stew_analysis RENAME COLUMN ratingcomplexity TO rating_complexity;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'flavorprofilenotes') THEN
    ALTER TABLE stew_analysis RENAME COLUMN flavorprofilenotes TO flavor_profile_notes;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'texturethickness') THEN
    ALTER TABLE stew_analysis RENAME COLUMN texturethickness TO texture_thickness;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'appearancecolor') THEN
    ALTER TABLE stew_analysis RENAME COLUMN appearancecolor TO appearance_color;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'appearanceclarity') THEN
    ALTER TABLE stew_analysis RENAME COLUMN appearanceclarity TO appearance_clarity;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'keyquote') THEN
    ALTER TABLE stew_analysis RENAME COLUMN keyquote TO key_quote;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'generalnotes') THEN
    ALTER TABLE stew_analysis RENAME COLUMN generalnotes TO general_notes;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'ratinginferred') THEN
    ALTER TABLE stew_analysis RENAME COLUMN ratinginferred TO rating_inferred;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'richnessinferred') THEN
    ALTER TABLE stew_analysis RENAME COLUMN richnessinferred TO richness_inferred;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stew_analysis' AND column_name = 'complexityinferred') THEN
    ALTER TABLE stew_analysis RENAME COLUMN complexityinferred TO complexity_inferred;
  END IF;
END $$;

ALTER TABLE stew_analysis
  ALTER COLUMN creator_sentiment TYPE creator_sentiment
  USING creator_sentiment::creator_sentiment;

ALTER TABLE stew_analysis
  ALTER COLUMN rating_inferred SET DEFAULT FALSE;
ALTER TABLE stew_analysis
  ALTER COLUMN richness_inferred SET DEFAULT FALSE;
ALTER TABLE stew_analysis
  ALTER COLUMN complexity_inferred SET DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS stew_analysis_video_id_unique ON stew_analysis (video_id);
CREATE INDEX IF NOT EXISTS stew_analysis_video_day_idx ON stew_analysis (video_day);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'ingredientid') THEN
      ALTER TABLE ingredients RENAME COLUMN ingredientid TO ingredient_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'ingredientname') THEN
      ALTER TABLE ingredients RENAME COLUMN ingredientname TO ingredient_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'ingredientcategory') THEN
      ALTER TABLE ingredients RENAME COLUMN ingredientcategory TO ingredient_category;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ingredients (
  ingredient_id SERIAL PRIMARY KEY,
  ingredient_name TEXT NOT NULL UNIQUE,
  ingredient_category TEXT NOT NULL
);

DO $$
BEGIN
  IF to_regclass('public.ingredientadditions') IS NOT NULL AND to_regclass('public.ingredient_additions') IS NULL THEN
    ALTER TABLE ingredientadditions RENAME TO ingredient_additions;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ingredient_additions (
  addition_id SERIAL PRIMARY KEY,
  analysis_id INTEGER NOT NULL REFERENCES stew_analysis(analysis_id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  prep_style TEXT NOT NULL,
  quantity_est TEXT
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredient_additions' AND column_name = 'additionid') THEN
    ALTER TABLE ingredient_additions RENAME COLUMN additionid TO addition_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredient_additions' AND column_name = 'analysisid') THEN
    ALTER TABLE ingredient_additions RENAME COLUMN analysisid TO analysis_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredient_additions' AND column_name = 'ingredientid') THEN
    ALTER TABLE ingredient_additions RENAME COLUMN ingredientid TO ingredient_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredient_additions' AND column_name = 'prepstyle') THEN
    ALTER TABLE ingredient_additions RENAME COLUMN prepstyle TO prep_style;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredient_additions' AND column_name = 'quantityest') THEN
    ALTER TABLE ingredient_additions RENAME COLUMN quantityest TO quantity_est;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ingredient_additions_analysis_idx ON ingredient_additions (analysis_id);
CREATE INDEX IF NOT EXISTS ingredient_additions_ingredient_idx ON ingredient_additions (ingredient_id);

CREATE TABLE IF NOT EXISTS video_transcripts (
  transcript_id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  transcript_status transcript_status NOT NULL DEFAULT 'pending',
  language VARCHAR(16) DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS video_transcripts_status_idx ON video_transcripts (transcript_status);

CREATE TABLE IF NOT EXISTS transcript_chunks (
  chunk_id SERIAL PRIMARY KEY,
  transcript_id INTEGER NOT NULL REFERENCES video_transcripts(transcript_id) ON DELETE CASCADE,
  chunk_order INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  start_second INTEGER,
  end_second INTEGER,
  token_estimate INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transcript_chunks_transcript_order_unique UNIQUE (transcript_id, chunk_order)
);

CREATE INDEX IF NOT EXISTS transcript_chunks_transcript_idx ON transcript_chunks (transcript_id);

CREATE TABLE IF NOT EXISTS transcript_embeddings (
  embedding_id SERIAL PRIMARY KEY,
  chunk_id INTEGER NOT NULL UNIQUE REFERENCES transcript_chunks(chunk_id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL CHECK (dimensions > 0),
  embedding vector(768) NOT NULL,
  embedding_status embedding_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS transcript_embeddings_status_idx ON transcript_embeddings (embedding_status);
CREATE INDEX IF NOT EXISTS transcript_embeddings_embedding_idx
  ON transcript_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
