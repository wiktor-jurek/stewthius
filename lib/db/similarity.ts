import { sql } from "drizzle-orm";
import { db } from "./client";

export type SimilarVideoRow = {
  videoId: string;
  day: number;
  tiktokUrl: string | null;
  title: string | null;
  distance: number;
};

export async function queryVideoSummaryEmbeddings() {
  const result = await db.execute(sql`
    SELECT
      v.video_id AS "videoId",
      vse.embedding::text AS "embedding"
    FROM video_summary_embeddings vse
    JOIN videos v ON vse.video_id = v.id
    JOIN stew_analysis sa ON sa.video_id = v.id
    WHERE sa.video_day IS NOT NULL
    ORDER BY sa.video_day
  `);

  return result.rows as { videoId: string; embedding: string }[];
}

export async function querySimilarVideos(sourceVideoId: string, limit: number) {
  const result = await db.execute(sql`
    WITH source AS (
      SELECT vse.embedding
      FROM video_summary_embeddings vse
      JOIN videos v ON vse.video_id = v.id
      WHERE v.video_id = ${sourceVideoId}
      LIMIT 1
    )
    SELECT
      v.video_id AS "videoId",
      sa.video_day AS day,
      v.tiktok_url AS "tiktokUrl",
      v.title AS title,
      vse.embedding <=> (SELECT embedding FROM source) AS distance
    FROM video_summary_embeddings vse
    JOIN videos v ON vse.video_id = v.id
    JOIN stew_analysis sa ON sa.video_id = v.id
    WHERE v.video_id <> ${sourceVideoId}
    ORDER BY distance ASC
    LIMIT ${limit}
  `);

  return result.rows as SimilarVideoRow[];
}
