#!/usr/bin/env tsx

import { eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "../../lib/db/client";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBED_MODEL =
  process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = Number.parseInt(
  process.env.EMBEDDING_DIMENSIONS || "768",
  10,
);

if (!GEMINI_API_KEY) {
  console.error("Missing required env var: GEMINI_API_KEY");
  process.exit(1);
}

async function getEmbedding(textValue: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_EMBED_MODEL)}:embedContent?key=${encodeURIComponent(GEMINI_API_KEY || "")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: textValue }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini embedding error ${response.status}: ${errText}`);
  }

  const json = (await response.json()) as {
    embedding?: { values?: number[] };
  };
  const values = json.embedding?.values ?? [];
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding response is missing embedding.values");
  }
  return values;
}

function buildSummaryParagraph(row: {
  day: number;
  sentiment: string;
  ratingOverall: string | null;
  ratingRichness: string | null;
  ratingComplexity: string | null;
  ingredients: string[];
  flavorNotes: string | null;
  transcript: string | null;
}): string {
  const lines: string[] = [`Day ${row.day} Summary:`];

  const overall = row.ratingOverall ? `${row.ratingOverall}/10` : "N/A";
  const richness = row.ratingRichness ? `${row.ratingRichness}/10` : "N/A";
  const complexity = row.ratingComplexity
    ? `${row.ratingComplexity}/10`
    : "N/A";
  lines.push(
    `Metrics: Overall Rating: ${overall}. Richness: ${richness}. Complexity: ${complexity}.`,
  );

  lines.push(`Vibe: Creator Sentiment is ${row.sentiment}.`);

  if (row.ingredients.length > 0) {
    lines.push(`Ingredients Added: ${row.ingredients.join(", ")}.`);
  } else {
    lines.push("Ingredients Added: None.");
  }

  if (row.flavorNotes) {
    lines.push(`Flavor Notes: ${row.flavorNotes}`);
  }

  if (row.transcript) {
    const maxTranscript = 800;
    const truncated =
      row.transcript.length > maxTranscript
        ? `${row.transcript.slice(0, maxTranscript)}...`
        : row.transcript;
    lines.push(`Transcript: "${truncated}"`);
  }

  return lines.join("\n");
}

async function main() {
  console.log("Backfilling summary embeddings for existing videos...");

  const rows = await db.execute(sql`
    SELECT
      v.id AS "videoDbId",
      v.video_id AS "videoId",
      sa.video_day AS "day",
      sa.creator_sentiment AS "sentiment",
      sa.rating_overall AS "ratingOverall",
      sa.rating_richness AS "ratingRichness",
      sa.rating_complexity AS "ratingComplexity",
      sa.flavor_profile_notes AS "flavorNotes",
      vt.transcript_text AS "transcript",
      ARRAY_AGG(DISTINCT i.ingredient_name) FILTER (WHERE i.ingredient_name IS NOT NULL) AS "ingredients"
    FROM stew_analysis sa
    JOIN videos v ON sa.video_id = v.id
    LEFT JOIN video_transcripts vt ON vt.video_id = v.id
    LEFT JOIN ingredient_additions ia ON sa.analysis_id = ia.analysis_id
    LEFT JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
    WHERE sa.video_day IS NOT NULL
      AND v.id NOT IN (SELECT video_id FROM video_summary_embeddings)
    GROUP BY v.id, v.video_id, sa.video_day, sa.creator_sentiment,
             sa.rating_overall, sa.rating_richness, sa.rating_complexity,
             sa.flavor_profile_notes, vt.transcript_text
    ORDER BY sa.video_day
  `);

  const videos = rows.rows as Array<{
    videoDbId: number;
    videoId: string;
    day: number;
    sentiment: string;
    ratingOverall: string | null;
    ratingRichness: string | null;
    ratingComplexity: string | null;
    flavorNotes: string | null;
    transcript: string | null;
    ingredients: string[] | null;
  }>;

  if (videos.length === 0) {
    console.log("All videos already have summary embeddings.");
    return;
  }

  console.log(`Found ${videos.length} video(s) missing summary embeddings.`);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(
      `[${i + 1}/${videos.length}] Day ${video.day} (${video.videoId})`,
    );

    try {
      const summaryText = buildSummaryParagraph({
        day: video.day,
        sentiment: video.sentiment,
        ratingOverall: video.ratingOverall,
        ratingRichness: video.ratingRichness,
        ratingComplexity: video.ratingComplexity,
        ingredients: video.ingredients || [],
        flavorNotes: video.flavorNotes,
        transcript: video.transcript,
      });

      const embedding = await getEmbedding(summaryText);

      await db
        .insert(schema.videoSummaryEmbeddings)
        .values({
          videoId: video.videoDbId,
          summaryText,
          model: GEMINI_EMBED_MODEL,
          dimensions: EMBEDDING_DIMENSIONS,
          embedding,
        })
        .onConflictDoUpdate({
          target: schema.videoSummaryEmbeddings.videoId,
          set: {
            summaryText,
            model: GEMINI_EMBED_MODEL,
            dimensions: EMBEDDING_DIMENSIONS,
            embedding,
            createdAt: sql`CURRENT_TIMESTAMP`,
          },
        });

      success++;
    } catch (error) {
      failed++;
      console.error(`  Failed: ${error}`);
    }
  }

  console.log(`Done. Success=${success} Failed=${failed}`);
}

main().catch((error) => {
  console.error("Backfill task failed:", error);
  process.exit(1);
});
