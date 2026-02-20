#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadLocalEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = rawValue;
    }
  }
}

loadLocalEnvFile();

const SOURCE_DATABASE_URL = process.env.DATABASE_URL;
const TARGET_DATABASE_URL = process.env.NEW_DATABASE_URL;

if (!SOURCE_DATABASE_URL) {
  console.error("Missing required env var: DATABASE_URL (source DB)");
  process.exit(1);
}

if (!TARGET_DATABASE_URL) {
  console.error("Missing required env var: NEW_DATABASE_URL (target DB)");
  process.exit(1);
}

type VideoRow = {
  id: number;
  tiktok_url: string;
  video_id: string;
  title: string | null;
  description: string | null;
  author: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  file_size: number | null;
  b2_key: string | null;
  is_about_stew: boolean | null;
  processing_status: string | null;
  download_date: string | null;
  created_at: string | null;
};

type AnalysisRow = {
  analysis_id: number;
  video_id: number;
  video_day: number;
  creator_sentiment: string;
  rating_overall: string | null;
  rating_richness: string | null;
  rating_complexity: string | null;
  flavor_profile_notes: string | null;
  texture_thickness: string | null;
  appearance_color: string | null;
  appearance_clarity: string | null;
  key_quote: string | null;
  general_notes: string;
  rating_inferred: boolean | null;
  richness_inferred: boolean | null;
  complexity_inferred: boolean | null;
  raw_gemini_response: string | null;
  created_at: string | null;
};

type IngredientRow = {
  ingredient_id: number;
  ingredient_name: string;
  ingredient_category: string;
};

type AdditionRow = {
  addition_id: number;
  analysis_id: number;
  ingredient_id: number;
  prep_style: string;
};

const SENTIMENTS = new Set([
  "Super Positive",
  "Positive",
  "Neutral",
  "Negative",
  "Super Negative",
]);
const PROCESSING_STATUSES = new Set(["unprocessed", "analyzed", "failed"]);
const STATUS_MAP: Record<string, string> = {
  processed: "analyzed",
  embedded: "analyzed",
};

function normalizeSentiment(value: string | null) {
  const candidate = String(value || "");
  return SENTIMENTS.has(candidate) ? candidate : "Neutral";
}

function normalizeStatus(value: string | null) {
  const candidate = String(value || "");
  const mapped = STATUS_MAP[candidate] ?? candidate;
  return PROCESSING_STATUSES.has(mapped) ? mapped : "failed";
}

async function queryFirstSuccess<T>(
  pool: Pool,
  candidates: string[],
): Promise<T[]> {
  let lastError: unknown;
  for (const query of candidates) {
    try {
      const result = await pool.query(query);
      return result.rows as T[];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function loadSourceData(sourcePool: Pool) {
  const videos = await sourcePool.query<VideoRow>(`
    SELECT
      id,
      tiktok_url,
      video_id,
      title,
      description,
      author,
      duration,
      view_count,
      like_count,
      comment_count,
      share_count,
      file_size,
      b2_key,
      is_about_stew,
      processing_status::text AS processing_status,
      download_date,
      created_at
    FROM videos
    ORDER BY id ASC
  `);

  const analyses = await queryFirstSuccess<AnalysisRow>(sourcePool, [
    `
      SELECT
        analysisid AS analysis_id,
        videoid AS video_id,
        videoday AS video_day,
        creatorsentiment AS creator_sentiment,
        ratingoverall AS rating_overall,
        ratingrichness AS rating_richness,
        ratingcomplexity AS rating_complexity,
        flavorprofilenotes AS flavor_profile_notes,
        texturethickness AS texture_thickness,
        appearancecolor AS appearance_color,
        appearanceclarity AS appearance_clarity,
        keyquote AS key_quote,
        generalnotes AS general_notes,
        ratinginferred AS rating_inferred,
        richnessinferred AS richness_inferred,
        complexityinferred AS complexity_inferred,
        raw_gemini_response,
        NULL::timestamp AS created_at
      FROM stewanalysis
      ORDER BY analysisid ASC
    `,
    `
      SELECT
        analysis_id,
        video_id,
        video_day,
        creator_sentiment,
        rating_overall,
        rating_richness,
        rating_complexity,
        flavor_profile_notes,
        texture_thickness,
        appearance_color,
        appearance_clarity,
        key_quote,
        general_notes,
        rating_inferred,
        richness_inferred,
        complexity_inferred,
        raw_gemini_response,
        created_at
      FROM stew_analysis
      ORDER BY analysis_id ASC
    `,
  ]);

  const ingredients = await queryFirstSuccess<IngredientRow>(sourcePool, [
    `
      SELECT
        ingredientid AS ingredient_id,
        ingredientname AS ingredient_name,
        ingredientcategory AS ingredient_category
      FROM ingredients
      ORDER BY ingredientid ASC
    `,
    `
      SELECT
        ingredient_id,
        ingredient_name,
        ingredient_category
      FROM ingredients
      ORDER BY ingredient_id ASC
    `,
  ]);

  const additions = await queryFirstSuccess<AdditionRow>(sourcePool, [
    `
      SELECT
        additionid AS addition_id,
        analysisid AS analysis_id,
        ingredientid AS ingredient_id,
        prepstyle AS prep_style
      FROM ingredientadditions
      ORDER BY additionid ASC
    `,
    `
      SELECT
        addition_id,
        analysis_id,
        ingredient_id,
        prep_style
      FROM ingredient_additions
      ORDER BY addition_id ASC
    `,
  ]);

  return {
    videos: videos.rows,
    analyses,
    ingredients,
    additions,
  };
}

async function migrateData() {
  const sourcePool = new Pool({ connectionString: SOURCE_DATABASE_URL });
  const targetPool = new Pool({ connectionString: TARGET_DATABASE_URL });

  try {
    console.log("Loading data from source database...");
    const data = await loadSourceData(sourcePool);
    console.log(
      `Loaded videos=${data.videos.length} analyses=${data.analyses.length} ingredients=${data.ingredients.length} additions=${data.additions.length}`,
    );

    const client = await targetPool.connect();
    try {
      await client.query("BEGIN");

      for (const row of data.videos) {
        await client.query(
          `
            INSERT INTO videos (
              id, tiktok_url, video_id, title, description, author, duration,
              view_count, like_count, comment_count, share_count, file_size, b2_key,
              is_about_stew, processing_status, download_date, created_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12, $13,
              $14, $15::processing_status, $16, $17
            )
            ON CONFLICT (id) DO UPDATE SET
              tiktok_url = EXCLUDED.tiktok_url,
              video_id = EXCLUDED.video_id,
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              author = EXCLUDED.author,
              duration = EXCLUDED.duration,
              view_count = EXCLUDED.view_count,
              like_count = EXCLUDED.like_count,
              comment_count = EXCLUDED.comment_count,
              share_count = EXCLUDED.share_count,
              file_size = EXCLUDED.file_size,
              b2_key = EXCLUDED.b2_key,
              is_about_stew = EXCLUDED.is_about_stew,
              processing_status = EXCLUDED.processing_status,
              download_date = EXCLUDED.download_date,
              created_at = EXCLUDED.created_at
          `,
          [
            row.id,
            row.tiktok_url,
            row.video_id,
            row.title,
            row.description,
            row.author,
            row.duration,
            row.view_count,
            row.like_count,
            row.comment_count,
            row.share_count,
            row.file_size,
            row.b2_key,
            row.is_about_stew,
            normalizeStatus(row.processing_status),
            row.download_date,
            row.created_at,
          ],
        );
      }

      for (const row of data.analyses) {
        await client.query(
          `
            INSERT INTO stew_analysis (
              analysis_id, video_id, video_day, creator_sentiment,
              rating_overall, rating_richness, rating_complexity, flavor_profile_notes,
              texture_thickness, appearance_color, appearance_clarity, key_quote, general_notes,
              rating_inferred, richness_inferred, complexity_inferred, raw_gemini_response, created_at
            )
            VALUES (
              $1, $2, $3, $4::creator_sentiment,
              $5, $6, $7, $8,
              $9, $10, $11, $12, $13,
              $14, $15, $16, $17, COALESCE($18, CURRENT_TIMESTAMP)
            )
            ON CONFLICT (analysis_id) DO UPDATE SET
              video_id = EXCLUDED.video_id,
              video_day = EXCLUDED.video_day,
              creator_sentiment = EXCLUDED.creator_sentiment,
              rating_overall = EXCLUDED.rating_overall,
              rating_richness = EXCLUDED.rating_richness,
              rating_complexity = EXCLUDED.rating_complexity,
              flavor_profile_notes = EXCLUDED.flavor_profile_notes,
              texture_thickness = EXCLUDED.texture_thickness,
              appearance_color = EXCLUDED.appearance_color,
              appearance_clarity = EXCLUDED.appearance_clarity,
              key_quote = EXCLUDED.key_quote,
              general_notes = EXCLUDED.general_notes,
              rating_inferred = EXCLUDED.rating_inferred,
              richness_inferred = EXCLUDED.richness_inferred,
              complexity_inferred = EXCLUDED.complexity_inferred,
              raw_gemini_response = EXCLUDED.raw_gemini_response
          `,
          [
            row.analysis_id,
            row.video_id,
            row.video_day,
            normalizeSentiment(row.creator_sentiment),
            row.rating_overall,
            row.rating_richness,
            row.rating_complexity,
            row.flavor_profile_notes,
            row.texture_thickness,
            row.appearance_color,
            row.appearance_clarity,
            row.key_quote,
            row.general_notes,
            Boolean(row.rating_inferred),
            Boolean(row.richness_inferred),
            Boolean(row.complexity_inferred),
            row.raw_gemini_response,
            row.created_at,
          ],
        );
      }

      for (const row of data.ingredients) {
        await client.query(
          `
            INSERT INTO ingredients (ingredient_id, ingredient_name, ingredient_category)
            VALUES ($1, $2, $3::ingredient_category)
            ON CONFLICT (ingredient_id) DO UPDATE SET
              ingredient_name = EXCLUDED.ingredient_name,
              ingredient_category = EXCLUDED.ingredient_category
          `,
          [row.ingredient_id, row.ingredient_name, row.ingredient_category],
        );
      }

      for (const row of data.additions) {
        await client.query(
          `
            INSERT INTO ingredient_additions (addition_id, analysis_id, ingredient_id, prep_style)
            VALUES ($1, $2, $3, $4::prep_style)
            ON CONFLICT (addition_id) DO UPDATE SET
              analysis_id = EXCLUDED.analysis_id,
              ingredient_id = EXCLUDED.ingredient_id,
              prep_style = EXCLUDED.prep_style
          `,
          [row.addition_id, row.analysis_id, row.ingredient_id, row.prep_style],
        );
      }

      await client.query(`
        SELECT setval(pg_get_serial_sequence('videos', 'id'), COALESCE((SELECT MAX(id) FROM videos), 1), true);
        SELECT setval(pg_get_serial_sequence('stew_analysis', 'analysis_id'), COALESCE((SELECT MAX(analysis_id) FROM stew_analysis), 1), true);
        SELECT setval(pg_get_serial_sequence('ingredients', 'ingredient_id'), COALESCE((SELECT MAX(ingredient_id) FROM ingredients), 1), true);
        SELECT setval(pg_get_serial_sequence('ingredient_additions', 'addition_id'), COALESCE((SELECT MAX(addition_id) FROM ingredient_additions), 1), true);
      `);

      await client.query("COMMIT");
      console.log("Data migration complete.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await Promise.all([sourcePool.end(), targetPool.end()]);
  }
}

migrateData().catch((error) => {
  console.error("Data migration task failed:", error);
  process.exit(1);
});
