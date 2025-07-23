'use server';

import pool from './db';

// Interfaces based on the database schema
export interface StewRating {
  day: number;
  ratingOverall: number;
  ratingRichness: number;
  ratingComplexity: number;
}

export interface Ingredient {
  name: string;
  addedDay: number;
  popularity: number;
  impact: number;
}

export interface SentimentData {
  sentiment: string;
  count: number;
  percentage: number;
}

export interface Stats {
  currentDay: number;
  currentRating: number;
  totalIngredients: number;
}

// Get stew ratings over time
export async function getStewRatings(): Promise<StewRating[]> {
  try {
    const result = await pool.query(`
      SELECT 
        VideoDay as day,
        RatingOverall as ratingOverall,
        RatingRichness as ratingRichness,
        RatingComplexity as ratingComplexity
      FROM StewAnalysis 
      WHERE RatingOverall IS NOT NULL 
        AND RatingRichness IS NOT NULL 
        AND RatingComplexity IS NOT NULL
      ORDER BY VideoDay ASC
    `);
    
    return result.rows.map(row => ({
      day: row.day,
      ratingOverall: row.ratingoverall,
      ratingRichness: row.ratingrichness,
      ratingComplexity: row.ratingcomplexity,
    }));
  } catch (error) {
    console.error('Error fetching stew ratings:', error);
    return [];
  }
}

// Get current stats
export async function getCurrentStats(): Promise<Stats> {
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
}

// Get popular ingredients based on frequency of additions
export async function getPopularIngredients(): Promise<Ingredient[]> {
  try {
    const result = await pool.query(`
      SELECT 
        i.IngredientName as name,
        MIN(sa.VideoDay) as addedDay,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM IngredientAdditions) as popularity,
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
      popularity: Math.round(row.popularity),
      impact: Math.round((row.impact || 0) * 10) / 10,
    }));
  } catch (error) {
    console.error('Error fetching popular ingredients:', error);
    return [];
  }
}

// Get MVP ingredients (those with highest positive impact)
export async function getMVPIngredients(): Promise<Ingredient[]> {
  try {
    const result = await pool.query(`
      SELECT 
        i.IngredientName as name,
        MIN(sa.VideoDay) as addedDay,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM IngredientAdditions) as popularity,
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
      popularity: Math.round(row.popularity),
      impact: Math.round((row.impact || 0) * 10) / 10,
    }));
  } catch (error) {
    console.error('Error fetching MVP ingredients:', error);
    return [];
  }
}

// Get sentiment distribution
export async function getSentimentDistribution(): Promise<SentimentData[]> {
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
} 