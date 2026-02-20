'use server';

import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "./db/client";
import { queryVideoSummaryEmbeddings, querySimilarVideos } from "./db/similarity";
import { parseVector, projectToUMAP } from "./mds";
import { unstable_cache } from 'next/cache';

// Interfaces based on the database schema
export interface StewRating {
  day: number;
  ratingOverall: number;
  ratingRichness: number;
  ratingComplexity: number;
  creatorSentiment: string;
  ratingInferred: boolean;
  richnessInferred: boolean;
  complexityInferred: boolean;
}

export interface Ingredient {
  name: string;
  addedDay: number;
  timesAdded: number;
  impact: number;
}

export interface SentimentData {
  sentiment: string;
  count: number;
  percentage: number;
}

export interface Video {
  id: number;
  day: number;
  tiktokUrl: string;
  videoId: string;
  title?: string;
  author?: string;
  keyQuote?: string;
}

export interface Stats {
  currentDay: number;
  currentRating: number;
  totalIngredients: number;
}

export interface VideoAnalysis {
  day: number;
  videoId: string;
  sentiment: string;
  ingredientsAdded: string[];
  ratingOverall: number;
  ratingRichness: number;
  ratingComplexity: number;
  ratingInferred: boolean;
  richnessInferred: boolean;
  complexityInferred: boolean;
  keyQuote?: string;
  tiktokUrl?: string;
  likeCount?: number;
  viewCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export interface VideoEmbeddingPosition {
  videoId: string;
  x: number;
  y: number;
}

export interface SimilarVideo {
  sourceVideoId: string;
  videoId: string;
  day: number;
  tiktokUrl?: string;
  title?: string;
  distance: number;
  similarity: number;
}

// Get stew ratings over time
export async function getStewRatings(): Promise<StewRating[]> {
  return unstable_cache(
    async () => {
      try {
        const rows = await db
          .select({
            day: schema.stewAnalysis.videoDay,
            ratingOverall: schema.stewAnalysis.ratingOverall,
            ratingRichness: schema.stewAnalysis.ratingRichness,
            ratingComplexity: schema.stewAnalysis.ratingComplexity,
            creatorSentiment: schema.stewAnalysis.creatorSentiment,
            ratingInferred: schema.stewAnalysis.ratingInferred,
            richnessInferred: schema.stewAnalysis.richnessInferred,
            complexityInferred: schema.stewAnalysis.complexityInferred,
          })
          .from(schema.stewAnalysis)
          .where(
            sql`${schema.stewAnalysis.ratingOverall} IS NOT NULL
            AND ${schema.stewAnalysis.ratingRichness} IS NOT NULL
            AND ${schema.stewAnalysis.ratingComplexity} IS NOT NULL
            AND ${schema.stewAnalysis.creatorSentiment} IS NOT NULL`,
          )
          .orderBy(schema.stewAnalysis.videoDay);

        return rows.map((row) => ({
          day: row.day,
          ratingOverall: Number(row.ratingOverall),
          ratingRichness: Number(row.ratingRichness),
          ratingComplexity: Number(row.ratingComplexity),
          creatorSentiment: row.creatorSentiment,
          ratingInferred: row.ratingInferred,
          richnessInferred: row.richnessInferred,
          complexityInferred: row.complexityInferred,
        }));
      } catch (error) {
        console.error('Error fetching stew ratings:', error);
        return [];
      }
    },
    ['stew-ratings'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'ratings']
    }
  )();
}

// Get current stats
export async function getCurrentStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const latestDay = await db
          .select({
            day: schema.stewAnalysis.videoDay,
            rating: schema.stewAnalysis.ratingOverall,
          })
          .from(schema.stewAnalysis)
          .where(isNotNull(schema.stewAnalysis.ratingOverall))
          .orderBy(desc(schema.stewAnalysis.videoDay))
          .limit(1);

        const ingredientTotal = await db
          .select({
            total: sql<number>`COUNT(DISTINCT ${schema.ingredientAdditions.ingredientId})`,
          })
          .from(schema.ingredientAdditions);

        return {
          currentDay: latestDay[0]?.day || 0,
          currentRating: Number(latestDay[0]?.rating || 0),
          totalIngredients: Number(ingredientTotal[0]?.total || 0),
        };
      } catch (error) {
        console.error('Error fetching current stats:', error);
        return {
          currentDay: 0,
          currentRating: 0,
          totalIngredients: 0,
        };
      }
    },
    ['current-stats'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'stats']
    }
  )();
}

// Get popular ingredients based on frequency of additions
export async function getPopularIngredients(): Promise<Ingredient[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            i.ingredient_name AS name,
            MIN(sa.video_day) AS "addedDay",
            COUNT(*) AS "timesAdded",
            AVG(CASE
              WHEN sa_next.rating_overall IS NOT NULL AND sa_prev.rating_overall IS NOT NULL
              THEN sa_next.rating_overall - sa_prev.rating_overall
              ELSE 0
            END) AS impact
          FROM ingredient_additions ia
          JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
          JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
          LEFT JOIN stew_analysis sa_prev ON sa_prev.video_day = sa.video_day - 1
          LEFT JOIN stew_analysis sa_next ON sa_next.video_day = sa.video_day + 1
          GROUP BY i.ingredient_id, i.ingredient_name
          ORDER BY COUNT(*) DESC
          LIMIT 8
        `);

        return result.rows.map((row) => ({
          name: String(row.name),
          addedDay: Number(row.addedDay),
          timesAdded: Number(row.timesAdded),
          impact: Math.round(Number(row.impact || 0) * 10) / 10,
        }));
      } catch (error) {
        console.error('Error fetching popular ingredients:', error);
        return [];
      }
    },
    ['popular-ingredients'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'ingredients']
    }
  )();
}

// Get MVP ingredients (those with highest positive impact)
export async function getMVPIngredients(): Promise<Ingredient[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            i.ingredient_name AS name,
            MIN(sa.video_day) AS "addedDay",
            COUNT(*) AS "timesAdded",
            AVG(CASE
              WHEN sa_next.rating_overall IS NOT NULL AND sa_prev.rating_overall IS NOT NULL
              THEN sa_next.rating_overall - sa_prev.rating_overall
              ELSE 0
            END) AS impact
          FROM ingredient_additions ia
          JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
          JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
          LEFT JOIN stew_analysis sa_prev ON sa_prev.video_day = sa.video_day - 1
          LEFT JOIN stew_analysis sa_next ON sa_next.video_day = sa.video_day + 1
          GROUP BY i.ingredient_id, i.ingredient_name
          HAVING AVG(CASE
            WHEN sa_next.rating_overall IS NOT NULL AND sa_prev.rating_overall IS NOT NULL
            THEN sa_next.rating_overall - sa_prev.rating_overall
            ELSE 0
          END) > 0
          ORDER BY AVG(CASE
            WHEN sa_next.rating_overall IS NOT NULL AND sa_prev.rating_overall IS NOT NULL
            THEN sa_next.rating_overall - sa_prev.rating_overall
            ELSE 0
          END) DESC
          LIMIT 5
        `);

        return result.rows.map((row) => ({
          name: String(row.name),
          addedDay: Number(row.addedDay),
          timesAdded: Number(row.timesAdded),
          impact: Math.round(Number(row.impact || 0) * 10) / 10,
        }));
      } catch (error) {
        console.error('Error fetching MVP ingredients:', error);
        return [];
      }
    },
    ['mvp-ingredients'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'ingredients']
    }
  )();
}

// Get sentiment distribution
export async function getSentimentDistribution(): Promise<SentimentData[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            creator_sentiment AS sentiment,
            COUNT(*) AS count,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM stew_analysis), 0), 0) AS percentage
          FROM stew_analysis
          WHERE creator_sentiment IS NOT NULL
          GROUP BY creator_sentiment
          ORDER BY COUNT(*) DESC
        `);

        return result.rows.map((row) => ({
          sentiment: String(row.sentiment),
          count: Number(row.count),
          percentage: Number(row.percentage || 0),
        }));
      } catch (error) {
        console.error('Error fetching sentiment distribution:', error);
        return [];
      }
    },
    ['sentiment-distribution'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'sentiment']
    }
  )();
}

// Get the latest video (by highest day number)
export async function getLatestVideo(): Promise<Video | null> {
  return unstable_cache(
    async () => {
      try {
        const latestDayResult = await db
          .select({
            day: schema.stewAnalysis.videoDay,
            keyQuote: schema.stewAnalysis.keyQuote,
            videoId: schema.videos.videoId,
            id: schema.videos.id,
            tiktokUrl: schema.videos.tiktokUrl,
            title: schema.videos.title,
            author: schema.videos.author,
          })
          .from(schema.stewAnalysis)
          .innerJoin(schema.videos, eq(schema.stewAnalysis.videoId, schema.videos.id))
          .orderBy(desc(schema.stewAnalysis.videoDay))
          .limit(1);

        if (latestDayResult.length === 0) {
          return null;
        }

        const row = latestDayResult[0];
        return {
          id: row.id,
          day: row.day,
          tiktokUrl: row.tiktokUrl,
          videoId: row.videoId,
          title: row.title || undefined,
          author: row.author || undefined,
          keyQuote: row.keyQuote || undefined,
        };
      } catch (error) {
        console.error('Error fetching latest video:', error);
        return null;
      }
    },
    ['latest-video'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'videos']
    }
  )();
} 

// Get all videos with their analysis data
export async function getAllVideosAnalysis(): Promise<VideoAnalysis[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            sa.video_day AS day,
            v.video_id AS "videoId",
            sa.creator_sentiment AS sentiment,
            sa.rating_overall AS "ratingOverall",
            sa.rating_richness AS "ratingRichness",
            sa.rating_complexity AS "ratingComplexity",
            sa.rating_inferred AS "ratingInferred",
            sa.richness_inferred AS "richnessInferred",
            sa.complexity_inferred AS "complexityInferred",
            sa.key_quote AS "keyQuote",
            v.tiktok_url AS "tiktokUrl",
            v.like_count AS "likeCount",
            v.view_count AS "viewCount",
            v.comment_count AS "commentCount",
            v.share_count AS "shareCount",
            ARRAY_AGG(DISTINCT i.ingredient_name) FILTER (WHERE i.ingredient_name IS NOT NULL) AS "ingredientsAdded"
          FROM stew_analysis sa
          JOIN videos v ON sa.video_id = v.id
          LEFT JOIN ingredient_additions ia ON sa.analysis_id = ia.analysis_id
          LEFT JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
          WHERE sa.video_day IS NOT NULL
            AND sa.creator_sentiment IS NOT NULL
            AND sa.rating_overall IS NOT NULL
          GROUP BY
            sa.video_day, v.video_id, sa.creator_sentiment, sa.rating_overall, sa.rating_richness,
            sa.rating_complexity, sa.rating_inferred, sa.richness_inferred, sa.complexity_inferred,
            sa.key_quote, v.tiktok_url, v.like_count, v.view_count, v.comment_count, v.share_count
          ORDER BY sa.video_day DESC
        `);

        return result.rows.map((row) => ({
          day: Number(row.day),
          videoId: String(row.videoId),
          sentiment: String(row.sentiment),
          ratingOverall: Number(row.ratingOverall),
          ratingRichness: Number(row.ratingRichness),
          ratingComplexity: Number(row.ratingComplexity),
          ratingInferred: Boolean(row.ratingInferred),
          richnessInferred: Boolean(row.richnessInferred),
          complexityInferred: Boolean(row.complexityInferred),
          keyQuote: row.keyQuote ? String(row.keyQuote) : undefined,
          tiktokUrl: row.tiktokUrl ? String(row.tiktokUrl) : undefined,
          likeCount: Number(row.likeCount || 0),
          viewCount: Number(row.viewCount || 0),
          commentCount: Number(row.commentCount || 0),
          shareCount: Number(row.shareCount || 0),
          ingredientsAdded: Array.isArray(row.ingredientsAdded)
            ? row.ingredientsAdded.map((ingredient) => String(ingredient))
            : [],
        }));
      } catch (error) {
        console.error('Error fetching all videos analysis:', error);
        return [];
      }
    },
    ['all-videos-analysis'],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['stew-data', 'videos']
    }
  )();
}

export async function getVideoEmbeddingPositions(): Promise<VideoEmbeddingPosition[]> {
  try {
    return await unstable_cache(
      async () => {
        const rows = await queryVideoSummaryEmbeddings();
        if (rows.length < 2) return [];

        const embeddings = rows.map((r) => parseVector(r.embedding));
        const positions = projectToUMAP(embeddings);

        return rows.map((row, i) => ({
          videoId: row.videoId,
          x: positions[i][0],
          y: positions[i][1],
        }));
      },
      ["video-embedding-positions"],
      {
        revalidate: 3600,
        tags: ["stew-data", "videos", "similarity"],
      },
    )();
  } catch (error) {
    console.error("Error computing embedding positions:", error);
    return [];
  }
}

export async function getSimilarVideos(sourceVideoId: string, limit = 5): Promise<SimilarVideo[]> {
  return unstable_cache(
    async () => {
      try {
        const rows = await querySimilarVideos(sourceVideoId, limit);

        return rows.map((row) => {
          const distance = Number(row.distance || 0);
          return {
            sourceVideoId,
            videoId: String(row.videoId),
            day: Number(row.day),
            tiktokUrl: row.tiktokUrl ? String(row.tiktokUrl) : undefined,
            title: row.title ? String(row.title) : undefined,
            distance,
            similarity: Math.max(0, 1 - distance),
          };
        });
      } catch (error) {
        console.error("Error fetching similar videos:", error);
        return [];
      }
    },
    [`similar-videos-${sourceVideoId}-${limit}`],
    {
      revalidate: 86400,
      tags: ["stew-data", "videos", "similarity"],
    },
  )();
}

// ===== Ingredient Page Data =====

export interface IngredientDetail {
  ingredientId: number;
  name: string;
  category: string;
}

export interface IngredientContribution {
  day: number;
  sentiment: string;
  ratingOverall: number;
  date: string; // ISO date derived from video day
}

export interface IngredientImpactData {
  netImpact: number;
  totalAdditions: number;
  saviorDays: number;
  saboteurDays: number;
  bestDays: {
    day: number;
    delta: number;
    keyQuote?: string;
    tiktokUrl?: string;
  }[];
  worstDays: {
    day: number;
    delta: number;
    keyQuote?: string;
    tiktokUrl?: string;
  }[];
}

export interface FlavorFootprintData {
  ingredient: {
    richness: number;
    complexity: number;
    thickness: number;
    clarity: number;
    overall: number;
  };
  global: {
    richness: number;
    complexity: number;
    thickness: number;
    clarity: number;
    overall: number;
  };
}

export interface PrepStyleData {
  style: string;
  count: number;
  percentage: number;
}

export interface PairedIngredient {
  name: string;
  category: string;
  sharedDays: number;
  percentage: number;
}

export async function getIngredientBySlug(slug: string): Promise<IngredientDetail | null> {
  return unstable_cache(
    async () => {
      try {
        const name = decodeURIComponent(slug).replace(/-/g, ' ');
        const result = await db.execute(sql`
          SELECT
            ingredient_id AS "ingredientId",
            ingredient_name AS name,
            ingredient_category AS category
          FROM ingredients
          WHERE LOWER(ingredient_name) = LOWER(${name})
          LIMIT 1
        `);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
          ingredientId: Number(row.ingredientId),
          name: String(row.name),
          category: String(row.category),
        };
      } catch (error) {
        console.error('Error fetching ingredient:', error);
        return null;
      }
    },
    [`ingredient-detail-${slug}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

export async function getIngredientContributions(ingredientId: number): Promise<IngredientContribution[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            sa.video_day AS day,
            sa.creator_sentiment AS sentiment,
            sa.rating_overall AS "ratingOverall",
            v.download_date AS date
          FROM ingredient_additions ia
          JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
          JOIN videos v ON sa.video_id = v.id
          WHERE ia.ingredient_id = ${ingredientId}
            AND sa.video_day IS NOT NULL
            AND sa.creator_sentiment IS NOT NULL
          ORDER BY sa.video_day
        `);
        return result.rows.map((row) => ({
          day: Number(row.day),
          sentiment: String(row.sentiment),
          ratingOverall: Number(row.ratingOverall),
          date: row.date ? String(row.date).split('T')[0] : '',
        }));
      } catch (error) {
        console.error('Error fetching ingredient contributions:', error);
        return [];
      }
    },
    [`ingredient-contributions-${ingredientId}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

export async function getIngredientImpact(ingredientId: number): Promise<IngredientImpactData> {
  return unstable_cache(
    async () => {
      const empty: IngredientImpactData = {
        netImpact: 0, totalAdditions: 0, saviorDays: 0, saboteurDays: 0,
        bestDays: [], worstDays: [],
      };
      try {
        const result = await db.execute(sql`
          WITH day_deltas AS (
            SELECT
              sa.video_day AS day,
              sa.rating_overall AS rating,
              sa.key_quote AS key_quote,
              v.tiktok_url AS tiktok_url,
              sa.rating_overall - LAG(sa.rating_overall) OVER (ORDER BY sa.video_day) AS delta
            FROM ingredient_additions ia
            JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
            JOIN videos v ON sa.video_id = v.id
            WHERE ia.ingredient_id = ${ingredientId}
              AND sa.rating_overall IS NOT NULL
          )
          SELECT
            day, delta, key_quote, tiktok_url
          FROM day_deltas
          WHERE delta IS NOT NULL
          ORDER BY day
        `);

        const rows = result.rows.map((r) => ({
          day: Number(r.day),
          delta: Number(r.delta),
          keyQuote: r.key_quote ? String(r.key_quote) : undefined,
          tiktokUrl: r.tiktok_url ? String(r.tiktok_url) : undefined,
        }));

        const totalAdditions = rows.length;
        const netImpact = totalAdditions > 0
          ? Math.round((rows.reduce((s, r) => s + r.delta, 0) / totalAdditions) * 10) / 10
          : 0;
        const saviorDays = rows.filter((r) => r.delta > 0).length;
        const saboteurDays = rows.filter((r) => r.delta < 0).length;

        const sorted = [...rows].sort((a, b) => b.delta - a.delta);
        const bestDays = sorted.slice(0, 3).filter((r) => r.delta > 0);
        const worstDays = sorted.slice(-3).reverse().filter((r) => r.delta < 0).reverse();

        return { netImpact, totalAdditions, saviorDays, saboteurDays, bestDays, worstDays };
      } catch (error) {
        console.error('Error fetching ingredient impact:', error);
        return empty;
      }
    },
    [`ingredient-impact-${ingredientId}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

export async function getIngredientFlavorFootprint(ingredientId: number): Promise<FlavorFootprintData> {
  return unstable_cache(
    async () => {
      const emptyProfile = { richness: 0, complexity: 0, thickness: 0, clarity: 0, overall: 0 };
      try {
        const result = await db.execute(sql`
          SELECT
            ROUND(AVG(sa.rating_richness)::numeric, 1) AS avg_richness,
            ROUND(AVG(sa.rating_complexity)::numeric, 1) AS avg_complexity,
            ROUND(AVG(sa.texture_thickness)::numeric, 1) AS avg_thickness,
            ROUND(AVG(sa.appearance_clarity)::numeric, 1) AS avg_clarity,
            ROUND(AVG(sa.rating_overall)::numeric, 1) AS avg_overall
          FROM ingredient_additions ia
          JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
          WHERE ia.ingredient_id = ${ingredientId}
            AND sa.rating_richness IS NOT NULL
            AND sa.rating_complexity IS NOT NULL
        `);

        const globalResult = await db.execute(sql`
          SELECT
            ROUND(AVG(rating_richness)::numeric, 1) AS avg_richness,
            ROUND(AVG(rating_complexity)::numeric, 1) AS avg_complexity,
            ROUND(AVG(texture_thickness)::numeric, 1) AS avg_thickness,
            ROUND(AVG(appearance_clarity)::numeric, 1) AS avg_clarity,
            ROUND(AVG(rating_overall)::numeric, 1) AS avg_overall
          FROM stew_analysis
          WHERE rating_richness IS NOT NULL
            AND rating_complexity IS NOT NULL
        `);

        const parse = (row: Record<string, unknown>) => ({
          richness: Number(row.avg_richness || 0),
          complexity: Number(row.avg_complexity || 0),
          thickness: Number(row.avg_thickness || 0),
          clarity: Number(row.avg_clarity || 0),
          overall: Number(row.avg_overall || 0),
        });

        return {
          ingredient: result.rows[0] ? parse(result.rows[0]) : emptyProfile,
          global: globalResult.rows[0] ? parse(globalResult.rows[0]) : emptyProfile,
        };
      } catch (error) {
        console.error('Error fetching flavor footprint:', error);
        return { ingredient: emptyProfile, global: emptyProfile };
      }
    },
    [`ingredient-flavor-${ingredientId}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

export async function getIngredientPrepStyles(ingredientId: number): Promise<PrepStyleData[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            prep_style AS style,
            COUNT(*) AS count,
            ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 0) AS percentage
          FROM ingredient_additions
          WHERE ingredient_id = ${ingredientId}
          GROUP BY prep_style
          ORDER BY COUNT(*) DESC
        `);
        return result.rows.map((row) => ({
          style: String(row.style),
          count: Number(row.count),
          percentage: Number(row.percentage),
        }));
      } catch (error) {
        console.error('Error fetching prep styles:', error);
        return [];
      }
    },
    [`ingredient-prep-${ingredientId}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

export async function getIngredientPairings(ingredientId: number): Promise<PairedIngredient[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          WITH target_analyses AS (
            SELECT DISTINCT analysis_id
            FROM ingredient_additions
            WHERE ingredient_id = ${ingredientId}
          ),
          total_appearances AS (
            SELECT COUNT(*) AS total FROM target_analyses
          )
          SELECT
            i.ingredient_name AS name,
            i.ingredient_category AS category,
            COUNT(DISTINCT ia.analysis_id) AS "sharedDays",
            ROUND(
              COUNT(DISTINCT ia.analysis_id) * 100.0 / NULLIF((SELECT total FROM total_appearances), 0),
              0
            ) AS percentage
          FROM ingredient_additions ia
          JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
          WHERE ia.analysis_id IN (SELECT analysis_id FROM target_analyses)
            AND ia.ingredient_id != ${ingredientId}
          GROUP BY i.ingredient_id, i.ingredient_name, i.ingredient_category
          ORDER BY COUNT(DISTINCT ia.analysis_id) DESC
          LIMIT 6
        `);
        return result.rows.map((row) => ({
          name: String(row.name),
          category: String(row.category),
          sharedDays: Number(row.sharedDays),
          percentage: Number(row.percentage),
        }));
      } catch (error) {
        console.error('Error fetching pairings:', error);
        return [];
      }
    },
    [`ingredient-pairings-${ingredientId}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

// ===== Video Detail Page Data =====

export interface VideoDetail {
  day: number;
  videoId: string;
  tiktokUrl: string;
  title?: string;
  author?: string;
  keyQuote?: string;
  creatorSentiment: string;
  ratingOverall: number;
  ratingRichness: number;
  ratingComplexity: number;
  ratingOverallConfidence?: number;
  ratingRichnessConfidence?: number;
  ratingComplexityConfidence?: number;
  ratingInferred: boolean;
  richnessInferred: boolean;
  complexityInferred: boolean;
  textureThickness?: number;
  appearanceClarity?: number;
  appearanceColor?: string;
  flavorProfileNotes?: string;
  generalNotes: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export interface DayDelta {
  metric: string;
  current: number;
  previous: number | null;
  delta: number | null;
}

export interface DayIngredient {
  name: string;
  category: string;
  prepStyle: string;
  comment?: string;
}

export interface PercentileComparison {
  viewPercentile: number;
  ratingPercentile: number;
  viewCount: number;
  ratingOverall: number;
}

export async function getVideoDetailByDay(day: number): Promise<VideoDetail | null> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            sa.video_day AS day,
            v.video_id AS "videoId",
            v.tiktok_url AS "tiktokUrl",
            v.title,
            v.author,
            sa.key_quote AS "keyQuote",
            sa.creator_sentiment AS "creatorSentiment",
            sa.rating_overall AS "ratingOverall",
            sa.rating_richness AS "ratingRichness",
            sa.rating_complexity AS "ratingComplexity",
            sa.rating_overall_confidence AS "ratingOverallConfidence",
            sa.rating_richness_confidence AS "ratingRichnessConfidence",
            sa.rating_complexity_confidence AS "ratingComplexityConfidence",
            sa.rating_inferred AS "ratingInferred",
            sa.richness_inferred AS "richnessInferred",
            sa.complexity_inferred AS "complexityInferred",
            sa.texture_thickness AS "textureThickness",
            sa.appearance_clarity AS "appearanceClarity",
            sa.appearance_color AS "appearanceColor",
            sa.flavor_profile_notes AS "flavorProfileNotes",
            sa.general_notes AS "generalNotes",
            v.view_count AS "viewCount",
            v.like_count AS "likeCount",
            v.comment_count AS "commentCount",
            v.share_count AS "shareCount"
          FROM stew_analysis sa
          JOIN videos v ON sa.video_id = v.id
          WHERE sa.video_day = ${day}
          LIMIT 1
        `);

        if (result.rows.length === 0) return null;
        const r = result.rows[0];
        return {
          day: Number(r.day),
          videoId: String(r.videoId),
          tiktokUrl: String(r.tiktokUrl),
          title: r.title ? String(r.title) : undefined,
          author: r.author ? String(r.author) : undefined,
          keyQuote: r.keyQuote ? String(r.keyQuote) : undefined,
          creatorSentiment: String(r.creatorSentiment),
          ratingOverall: Number(r.ratingOverall),
          ratingRichness: Number(r.ratingRichness),
          ratingComplexity: Number(r.ratingComplexity),
          ratingOverallConfidence: r.ratingOverallConfidence != null ? Number(r.ratingOverallConfidence) : undefined,
          ratingRichnessConfidence: r.ratingRichnessConfidence != null ? Number(r.ratingRichnessConfidence) : undefined,
          ratingComplexityConfidence: r.ratingComplexityConfidence != null ? Number(r.ratingComplexityConfidence) : undefined,
          ratingInferred: Boolean(r.ratingInferred),
          richnessInferred: Boolean(r.richnessInferred),
          complexityInferred: Boolean(r.complexityInferred),
          textureThickness: r.textureThickness != null ? Number(r.textureThickness) : undefined,
          appearanceClarity: r.appearanceClarity != null ? Number(r.appearanceClarity) : undefined,
          appearanceColor: r.appearanceColor ? String(r.appearanceColor) : undefined,
          flavorProfileNotes: r.flavorProfileNotes ? String(r.flavorProfileNotes) : undefined,
          generalNotes: String(r.generalNotes),
          viewCount: Number(r.viewCount || 0),
          likeCount: Number(r.likeCount || 0),
          commentCount: Number(r.commentCount || 0),
          shareCount: Number(r.shareCount || 0),
        };
      } catch (error) {
        console.error('Error fetching video detail:', error);
        return null;
      }
    },
    [`video-detail-day-${day}`],
    { revalidate: 86400, tags: ['stew-data', 'videos'] },
  )();
}

export async function getDayDeltas(day: number): Promise<DayDelta[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            curr.rating_overall AS curr_overall,
            curr.rating_richness AS curr_richness,
            curr.rating_complexity AS curr_complexity,
            curr.texture_thickness AS curr_thickness,
            curr.appearance_clarity AS curr_clarity,
            prev.rating_overall AS prev_overall,
            prev.rating_richness AS prev_richness,
            prev.rating_complexity AS prev_complexity,
            prev.texture_thickness AS prev_thickness,
            prev.appearance_clarity AS prev_clarity
          FROM stew_analysis curr
          LEFT JOIN stew_analysis prev ON prev.video_day = curr.video_day - 1
          WHERE curr.video_day = ${day}
          LIMIT 1
        `);

        if (result.rows.length === 0) return [];
        const r = result.rows[0];

        const metrics: { key: string; label: string; curr: string; prev: string }[] = [
          { key: 'overall', label: 'Overall', curr: 'curr_overall', prev: 'prev_overall' },
          { key: 'richness', label: 'Richness', curr: 'curr_richness', prev: 'prev_richness' },
          { key: 'complexity', label: 'Complexity', curr: 'curr_complexity', prev: 'prev_complexity' },
          { key: 'thickness', label: 'Thickness', curr: 'curr_thickness', prev: 'prev_thickness' },
          { key: 'clarity', label: 'Clarity', curr: 'curr_clarity', prev: 'prev_clarity' },
        ];

        return metrics
          .filter((m) => r[m.curr] != null)
          .map((m) => {
            const current = Number(r[m.curr]);
            const previous = r[m.prev] != null ? Number(r[m.prev]) : null;
            return {
              metric: m.label,
              current,
              previous,
              delta: previous != null ? Math.round((current - previous) * 10) / 10 : null,
            };
          });
      } catch (error) {
        console.error('Error fetching day deltas:', error);
        return [];
      }
    },
    [`day-deltas-${day}`],
    { revalidate: 86400, tags: ['stew-data', 'videos'] },
  )();
}

export async function getDayIngredients(day: number): Promise<DayIngredient[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            i.ingredient_name AS name,
            i.ingredient_category AS category,
            ia.prep_style AS "prepStyle",
            ia.comment
          FROM ingredient_additions ia
          JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
          JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
          WHERE sa.video_day = ${day}
          ORDER BY i.ingredient_category, i.ingredient_name
        `);

        return result.rows.map((r) => ({
          name: String(r.name),
          category: String(r.category),
          prepStyle: String(r.prepStyle),
          comment: r.comment ? String(r.comment) : undefined,
        }));
      } catch (error) {
        console.error('Error fetching day ingredients:', error);
        return [];
      }
    },
    [`day-ingredients-${day}`],
    { revalidate: 86400, tags: ['stew-data', 'ingredients'] },
  )();
}

export async function getVideoPercentile(day: number): Promise<PercentileComparison> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          WITH rankings AS (
            SELECT
              sa.video_day,
              v.view_count,
              sa.rating_overall,
              PERCENT_RANK() OVER (ORDER BY v.view_count) AS view_pct,
              PERCENT_RANK() OVER (ORDER BY sa.rating_overall) AS rating_pct
            FROM stew_analysis sa
            JOIN videos v ON sa.video_id = v.id
            WHERE sa.rating_overall IS NOT NULL
              AND v.view_count IS NOT NULL
              AND v.view_count > 0
          )
          SELECT view_count, rating_overall, view_pct, rating_pct
          FROM rankings
          WHERE video_day = ${day}
          LIMIT 1
        `);

        if (result.rows.length === 0) {
          return { viewPercentile: 0, ratingPercentile: 0, viewCount: 0, ratingOverall: 0 };
        }
        const r = result.rows[0];
        return {
          viewPercentile: Math.round(Number(r.view_pct) * 100),
          ratingPercentile: Math.round(Number(r.rating_pct) * 100),
          viewCount: Number(r.view_count || 0),
          ratingOverall: Number(r.rating_overall || 0),
        };
      } catch (error) {
        console.error('Error fetching video percentile:', error);
        return { viewPercentile: 0, ratingPercentile: 0, viewCount: 0, ratingOverall: 0 };
      }
    },
    [`video-percentile-${day}`],
    { revalidate: 86400, tags: ['stew-data', 'videos'] },
  )();
}

export async function getGlobalAverages(): Promise<{
  richness: number;
  complexity: number;
  thickness: number;
  clarity: number;
  overall: number;
}> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            ROUND(AVG(rating_richness)::numeric, 1) AS avg_richness,
            ROUND(AVG(rating_complexity)::numeric, 1) AS avg_complexity,
            ROUND(AVG(texture_thickness)::numeric, 1) AS avg_thickness,
            ROUND(AVG(appearance_clarity)::numeric, 1) AS avg_clarity,
            ROUND(AVG(rating_overall)::numeric, 1) AS avg_overall
          FROM stew_analysis
          WHERE rating_richness IS NOT NULL
            AND rating_complexity IS NOT NULL
        `);
        if (result.rows.length === 0) {
          return { richness: 0, complexity: 0, thickness: 0, clarity: 0, overall: 0 };
        }
        const r = result.rows[0];
        return {
          richness: Number(r.avg_richness || 0),
          complexity: Number(r.avg_complexity || 0),
          thickness: Number(r.avg_thickness || 0),
          clarity: Number(r.avg_clarity || 0),
          overall: Number(r.avg_overall || 0),
        };
      } catch (error) {
        console.error('Error fetching global averages:', error);
        return { richness: 0, complexity: 0, thickness: 0, clarity: 0, overall: 0 };
      }
    },
    ['global-averages'],
    { revalidate: 86400, tags: ['stew-data'] },
  )();
}

// Get top 5 and bottom 5 ingredients by next-day rating delta
export interface RankedIngredient {
  name: string;
  avgDelta: number;
  timesAdded: number;
}

export interface IngredientImpactRankings {
  top: RankedIngredient[];
  bottom: RankedIngredient[];
}

export async function getIngredientImpactRankings(): Promise<IngredientImpactRankings> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          WITH ingredient_day_deltas AS (
            SELECT DISTINCT
              i.ingredient_name AS name,
              sa.video_day,
              sa_next.rating_overall - sa.rating_overall AS delta
            FROM ingredient_additions ia
            JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
            JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
            JOIN stew_analysis sa_next ON sa_next.video_day = sa.video_day + 1
            WHERE sa.rating_overall IS NOT NULL
              AND sa_next.rating_overall IS NOT NULL
          )
          SELECT
            name,
            ROUND(AVG(delta)::numeric, 2) AS "avgDelta",
            COUNT(*) AS "timesAdded"
          FROM ingredient_day_deltas
          GROUP BY name
          ORDER BY AVG(delta) DESC
        `);

        const rows = result.rows.map((r) => ({
          name: String(r.name),
          avgDelta: Number(r.avgDelta),
          timesAdded: Number(r.timesAdded),
        }));

        return {
          top: rows.slice(0, 5).filter((r) => r.avgDelta > 0),
          bottom: rows.slice(-5).filter((r) => r.avgDelta < 0).reverse(),
        };
      } catch (error) {
        console.error('Error fetching ingredient impact rankings:', error);
        return { top: [], bottom: [] };
      }
    },
    ['ingredient-impact-rankings'],
    {
      revalidate: 86400,
      tags: ['stew-data', 'ingredients'],
    },
  )();
}

// ===== Stats Page Data =====

export interface TrashToTreasureData {
  withTrash: {
    avgRating: number;
    avgRichness: number;
    avgComplexity: number;
    sampleSize: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
  };
  withoutTrash: {
    avgRating: number;
    avgRichness: number;
    avgComplexity: number;
    sampleSize: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
  };
}

export interface ViralVsTastyCategory {
  category: string;
  avgViews: number;
  avgRating: number;
  sampleSize: number;
}

export interface ClarityRichnessPoint {
  day: number;
  clarity: number;
  thickness: number;
  sentiment: string;
  rating: number;
}

export async function getTrashToTreasureData(): Promise<TrashToTreasureData> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          WITH day_trash_flag AS (
            SELECT
              sa.analysis_id,
              sa.rating_overall,
              sa.rating_richness,
              sa.rating_complexity,
              sa.creator_sentiment,
              BOOL_OR(ia.prep_style IN ('Leftover', 'Scrap')) AS has_trash
            FROM stew_analysis sa
            JOIN ingredient_additions ia ON sa.analysis_id = ia.analysis_id
            WHERE sa.rating_overall IS NOT NULL
              AND sa.rating_richness IS NOT NULL
              AND sa.rating_complexity IS NOT NULL
            GROUP BY sa.analysis_id, sa.rating_overall, sa.rating_richness,
                     sa.rating_complexity, sa.creator_sentiment
          )
          SELECT
            has_trash,
            ROUND(AVG(rating_overall)::numeric, 1) AS avg_rating,
            ROUND(AVG(rating_richness)::numeric, 1) AS avg_richness,
            ROUND(AVG(rating_complexity)::numeric, 1) AS avg_complexity,
            COUNT(*) AS sample_size,
            ROUND(COUNT(*) FILTER (WHERE creator_sentiment IN ('Super Positive', 'Positive'))
              * 100.0 / NULLIF(COUNT(*), 0), 0) AS positive_pct,
            ROUND(COUNT(*) FILTER (WHERE creator_sentiment = 'Neutral')
              * 100.0 / NULLIF(COUNT(*), 0), 0) AS neutral_pct,
            ROUND(COUNT(*) FILTER (WHERE creator_sentiment IN ('Negative', 'Super Negative'))
              * 100.0 / NULLIF(COUNT(*), 0), 0) AS negative_pct
          FROM day_trash_flag
          GROUP BY has_trash
        `);

        const emptyGroup = {
          avgRating: 0, avgRichness: 0, avgComplexity: 0,
          sampleSize: 0, positivePercent: 0, neutralPercent: 0, negativePercent: 0,
        };

        const parseGroup = (row: Record<string, unknown>) => ({
          avgRating: Number(row.avg_rating),
          avgRichness: Number(row.avg_richness),
          avgComplexity: Number(row.avg_complexity),
          sampleSize: Number(row.sample_size),
          positivePercent: Number(row.positive_pct),
          neutralPercent: Number(row.neutral_pct),
          negativePercent: Number(row.negative_pct),
        });

        const withTrash = result.rows.find((r) => r.has_trash === true);
        const withoutTrash = result.rows.find((r) => r.has_trash === false);

        return {
          withTrash: withTrash ? parseGroup(withTrash) : emptyGroup,
          withoutTrash: withoutTrash ? parseGroup(withoutTrash) : emptyGroup,
        };
      } catch (error) {
        console.error('Error fetching trash to treasure data:', error);
        const emptyGroup = {
          avgRating: 0, avgRichness: 0, avgComplexity: 0,
          sampleSize: 0, positivePercent: 0, neutralPercent: 0, negativePercent: 0,
        };
        return { withTrash: emptyGroup, withoutTrash: emptyGroup };
      }
    },
    ['trash-to-treasure'],
    {
      revalidate: 86400,
      tags: ['stew-data', 'stats', 'ingredients'],
    },
  )();
}

export async function getViralVsTastyData(): Promise<ViralVsTastyCategory[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            i.ingredient_category AS category,
            ROUND(AVG(v.view_count)::numeric, 0) AS avg_views,
            ROUND(AVG(sa.rating_overall::numeric), 1) AS avg_rating,
            COUNT(DISTINCT sa.analysis_id) AS sample_size
          FROM ingredient_additions ia
          JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
          JOIN stew_analysis sa ON ia.analysis_id = sa.analysis_id
          JOIN videos v ON sa.video_id = v.id
          WHERE sa.rating_overall IS NOT NULL
            AND v.view_count IS NOT NULL
            AND v.view_count > 0
          GROUP BY i.ingredient_category
          HAVING COUNT(DISTINCT sa.analysis_id) >= 3
          ORDER BY AVG(v.view_count) DESC
        `);

        return result.rows.map((row) => ({
          category: String(row.category),
          avgViews: Number(row.avg_views),
          avgRating: Number(row.avg_rating),
          sampleSize: Number(row.sample_size),
        }));
      } catch (error) {
        console.error('Error fetching viral vs tasty data:', error);
        return [];
      }
    },
    ['viral-vs-tasty'],
    {
      revalidate: 86400,
      tags: ['stew-data', 'stats', 'ingredients'],
    },
  )();
}

export async function getClarityRichnessData(): Promise<ClarityRichnessPoint[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await db.execute(sql`
          SELECT
            sa.video_day AS day,
            sa.appearance_clarity AS clarity,
            sa.texture_thickness AS thickness,
            sa.creator_sentiment AS sentiment,
            sa.rating_overall AS rating
          FROM stew_analysis sa
          WHERE sa.appearance_clarity IS NOT NULL
            AND sa.texture_thickness IS NOT NULL
            AND sa.creator_sentiment IS NOT NULL
            AND sa.rating_overall IS NOT NULL
          ORDER BY sa.video_day
        `);

        return result.rows.map((row) => ({
          day: Number(row.day),
          clarity: Number(row.clarity),
          thickness: Number(row.thickness),
          sentiment: String(row.sentiment),
          rating: Number(row.rating),
        }));
      } catch (error) {
        console.error('Error fetching clarity richness data:', error);
        return [];
      }
    },
    ['clarity-richness'],
    {
      revalidate: 86400,
      tags: ['stew-data', 'stats'],
    },
  )();
}