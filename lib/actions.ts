'use server';

import pool from './db';
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

// Get stew ratings over time
export async function getStewRatings(): Promise<StewRating[]> {
  return unstable_cache(
    async () => {
      try {
        const result = await pool.query(`
          SELECT 
            VideoDay as day,
            RatingOverall as ratingOverall,
            RatingRichness as ratingRichness,
            RatingComplexity as ratingComplexity,
            CreatorSentiment as creatorSentiment,
            ratingInferred as ratingInferred,
            richnessInferred as richnessInferred,
            complexityInferred as complexityInferred
          FROM StewAnalysis 
          WHERE RatingOverall IS NOT NULL 
            AND RatingRichness IS NOT NULL 
            AND RatingComplexity IS NOT NULL
            AND CreatorSentiment IS NOT NULL
          ORDER BY VideoDay ASC
        `);
        
        return result.rows.map(row => ({
          day: row.day,
          ratingOverall: row.ratingoverall,
          ratingRichness: row.ratingrichness,
          ratingComplexity: row.ratingcomplexity,
          creatorSentiment: row.creatorsentiment,
          ratingInferred: row.ratinginferred,
          richnessInferred: row.richnessinferred,
          complexityInferred: row.complexityinferred,
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
        // Get the latest day's data
        const latestResult = await pool.query(`
          SELECT VideoDay, RatingOverall 
          FROM StewAnalysis 
          WHERE RatingOverall IS NOT NULL
          ORDER BY VideoDay DESC 
          LIMIT 1
        `);

        // Get total unique ingredients count
        const ingredientResult = await pool.query(`
          SELECT COUNT(DISTINCT IngredientID) as total 
          FROM IngredientAdditions
        `);

        const latestDay = latestResult.rows[0];
        const totalIngredients = ingredientResult.rows[0]?.total || 0;

        return {
          currentDay: latestDay?.videoday || 0,
          currentRating: latestDay?.ratingoverall || 0,
          totalIngredients: parseInt(totalIngredients),
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
        const result = await pool.query(`
          SELECT 
            i.IngredientName as name,
            MIN(sa.VideoDay) as addedDay,
            COUNT(*) as timesAdded,
            AVG(CASE 
              WHEN sa_next.RatingOverall IS NOT NULL AND sa_prev.RatingOverall IS NOT NULL 
              THEN sa_next.RatingOverall - sa_prev.RatingOverall 
              ELSE 0 
            END) as impact
          FROM IngredientAdditions ia
          JOIN Ingredients i ON ia.IngredientID = i.IngredientID
          JOIN StewAnalysis sa ON ia.AnalysisID = sa.AnalysisID
          LEFT JOIN StewAnalysis sa_prev ON sa_prev.VideoDay = sa.VideoDay - 1
          LEFT JOIN StewAnalysis sa_next ON sa_next.VideoDay = sa.VideoDay + 1
          GROUP BY i.IngredientID, i.IngredientName
          ORDER BY COUNT(*) DESC
          LIMIT 8
        `);

        return result.rows.map(row => ({
          name: row.name,
          addedDay: row.addedday,
          timesAdded: parseInt(row.timesadded),
          impact: Math.round((row.impact || 0) * 10) / 10,
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
        const result = await pool.query(`
          SELECT 
            i.IngredientName as name,
            MIN(sa.VideoDay) as addedDay,
            COUNT(*) as timesAdded,
            AVG(CASE 
              WHEN sa_next.RatingOverall IS NOT NULL AND sa_prev.RatingOverall IS NOT NULL 
              THEN sa_next.RatingOverall - sa_prev.RatingOverall 
              ELSE 0 
            END) as impact
          FROM IngredientAdditions ia
          JOIN Ingredients i ON ia.IngredientID = i.IngredientID
          JOIN StewAnalysis sa ON ia.AnalysisID = sa.AnalysisID
          LEFT JOIN StewAnalysis sa_prev ON sa_prev.VideoDay = sa.VideoDay - 1
          LEFT JOIN StewAnalysis sa_next ON sa_next.VideoDay = sa.VideoDay + 1
          GROUP BY i.IngredientID, i.IngredientName
          HAVING AVG(CASE 
            WHEN sa_next.RatingOverall IS NOT NULL AND sa_prev.RatingOverall IS NOT NULL 
            THEN sa_next.RatingOverall - sa_prev.RatingOverall 
            ELSE 0 
          END) > 0
          ORDER BY AVG(CASE 
            WHEN sa_next.RatingOverall IS NOT NULL AND sa_prev.RatingOverall IS NOT NULL 
            THEN sa_next.RatingOverall - sa_prev.RatingOverall 
            ELSE 0 
          END) DESC
          LIMIT 5
        `);

        return result.rows.map(row => ({
          name: row.name,
          addedDay: row.addedday,
          timesAdded: parseInt(row.timesadded),
          impact: Math.round((row.impact || 0) * 10) / 10,
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
        const result = await pool.query(`
          SELECT 
            CreatorSentiment as sentiment,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM StewAnalysis), 0) as percentage
          FROM StewAnalysis 
          WHERE CreatorSentiment IS NOT NULL
          GROUP BY CreatorSentiment
          ORDER BY COUNT(*) DESC
        `);

        return result.rows.map(row => ({
          sentiment: row.sentiment,
          count: parseInt(row.count),
          percentage: parseInt(row.percentage),
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
        // First, let's try to get the latest day from StewAnalysis
        const latestDayResult = await pool.query(`
          SELECT VideoDay, VideoID, KeyQuote
          FROM StewAnalysis 
          ORDER BY VideoDay DESC 
          LIMIT 1
        `);

        if (latestDayResult.rows.length === 0) {
          return null;
        }

        const { videoday: day, videoid, keyquote } = latestDayResult.rows[0];

        // Try to find a matching video
        const videoResult = await pool.query(`
          SELECT id, tiktok_url, video_id, title, author
          FROM videos 
          WHERE video_id = $1 OR id = $2
          LIMIT 1
        `, [videoid, videoid]);

        if (videoResult.rows.length > 0) {
          const row = videoResult.rows[0];
          return {
            id: row.id,
            day: day,
            tiktokUrl: row.tiktok_url,
            videoId: row.video_id,
            title: row.title,
            author: row.author,
            keyQuote: keyquote,
          };
        }

        // If no matching video found, return a generic entry with the day
        return {
          id: 0,
          day: day,
          tiktokUrl: `https://www.tiktok.com/@perpetualstew`, // Fallback URL
          videoId: videoid?.toString() || '',
          title: `Day ${day} Video`,
          author: 'perpetualstew',
          keyQuote: keyquote,
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
        const result = await pool.query(`
          SELECT DISTINCT
            sa.VideoDay as day,
            sa.VideoID as videoId,
            sa.CreatorSentiment as sentiment,
            sa.RatingOverall as ratingOverall,
            sa.RatingRichness as ratingRichness,
            sa.RatingComplexity as ratingComplexity,
            sa.ratingInferred as ratingInferred,
            sa.richnessInferred as richnessInferred,
            sa.complexityInferred as complexityInferred,
            sa.KeyQuote as keyQuote,
            v.tiktok_url as tiktokUrl,
            v.like_count as likeCount,
            v.view_count as viewCount,
            v.comment_count as commentCount,
            v.share_count as shareCount,
            ARRAY_AGG(DISTINCT i.IngredientName) FILTER (WHERE i.IngredientName IS NOT NULL) as ingredientsAdded
          FROM StewAnalysis sa
          LEFT JOIN videos v ON sa.VideoID::text = v.video_id OR sa.VideoID = v.id
          LEFT JOIN IngredientAdditions ia ON sa.AnalysisID = ia.AnalysisID
          LEFT JOIN Ingredients i ON ia.IngredientID = i.IngredientID
          WHERE sa.VideoDay IS NOT NULL
            AND sa.CreatorSentiment IS NOT NULL
            AND sa.RatingOverall IS NOT NULL
          GROUP BY sa.VideoDay, sa.VideoID, sa.CreatorSentiment, sa.RatingOverall, sa.RatingRichness, sa.RatingComplexity, sa.ratingInferred, sa.richnessInferred, sa.complexityInferred, sa.KeyQuote, v.tiktok_url, v.like_count, v.view_count, v.comment_count, v.share_count
          ORDER BY sa.VideoDay DESC
        `);

        return result.rows.map(row => ({
          day: row.day,
          videoId: row.videoid,
          sentiment: row.sentiment,
          ratingOverall: row.ratingoverall,
          ratingRichness: row.ratingrichness,
          ratingComplexity: row.ratingcomplexity,
          ratingInferred: row.ratinginferred,
          richnessInferred: row.richnessinferred,
          complexityInferred: row.complexityinferred,
          keyQuote: row.keyquote,
          tiktokUrl: row.tiktokurl,
          likeCount: row.likecount,
          viewCount: row.viewcount,
          commentCount: row.commentcount,
          shareCount: row.sharecount,
          ingredientsAdded: row.ingredientsadded || [],
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