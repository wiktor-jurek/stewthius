import { revalidateTag } from "next/cache";

// Cache tag constants for easy management
export const CACHE_TAGS = {
  STEW_DATA: "stew-data",
  RATINGS: "ratings",
  STATS: "stats",
  INGREDIENTS: "ingredients",
  SENTIMENT: "sentiment",
  VIDEOS: "videos",
} as const;

// Individual cache invalidation functions
export async function invalidateStewRatings() {
  revalidateTag("stew-ratings", "/");
  revalidateTag(CACHE_TAGS.RATINGS, "/");
}

export async function invalidateCurrentStats() {
  revalidateTag("current-stats", "/");
  revalidateTag(CACHE_TAGS.STATS, "/");
}

export async function invalidateIngredients() {
  revalidateTag("popular-ingredients", "/");
  revalidateTag("mvp-ingredients", "/");
  revalidateTag(CACHE_TAGS.INGREDIENTS, "/");
}

export async function invalidateSentiment() {
  revalidateTag("sentiment-distribution", "/");
  revalidateTag(CACHE_TAGS.SENTIMENT, "/");
}

export async function invalidateVideos() {
  revalidateTag("latest-video", "/");
  revalidateTag("all-videos-analysis", "/");
  revalidateTag(CACHE_TAGS.VIDEOS, "/");
}

// Invalidate all stew-related data
export async function invalidateAllStewData() {
  revalidateTag(CACHE_TAGS.STEW_DATA, "/");
}

// Invalidate specific data types when you know what changed
export async function invalidateByDataType(
  dataType: "ratings" | "stats" | "ingredients" | "sentiment" | "videos" | "all"
) {
  switch (dataType) {
    case "ratings":
      await invalidateStewRatings();
      break;
    case "stats":
      await invalidateCurrentStats();
      break;
    case "ingredients":
      await invalidateIngredients();
      break;
    case "sentiment":
      await invalidateSentiment();
      break;
    case "videos":
      await invalidateVideos();
      break;
    case "all":
      await invalidateAllStewData();
      break;
  }
}
