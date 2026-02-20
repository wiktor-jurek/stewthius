import {
  bigint,
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    const dimensions = typeof config?.dimensions === "number" ? config.dimensions : 768;
    return `vector(${dimensions})`;
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
});

export const creatorSentimentEnum = pgEnum("creator_sentiment", [
  "Super Positive",
  "Positive",
  "Neutral",
  "Negative",
  "Super Negative",
]);

export const processingStatusEnum = pgEnum("processing_status", [
  "unprocessed",
  "analyzed",
  "failed",
]);

export const prepStyleEnum = pgEnum("prep_style", [
  "Raw",
  "Roasted",
  "Sautéed",
  "Boiled",
  "Leftover",
  "Scrap",
  "Jarred",
  "Fried",
  "Grilled",
  "Smoked",
  "Steamed",
  "Braised",
  "Baked",
  "Pickled",
  "Dried",
  "Canned",
  "Frozen",
  "Marinated",
  "Fermented",
  "Powdered",
  "Caramelized",
  "Cured",
  "Mashed",
  "Confit",
  "Blanched",
  "Poached",
  "Infused",
]);

export const ingredientCategoryEnum = pgEnum("ingredient_category", [
  "Aromatic Veg",
  "Root Veg",
  "Leafy Green",
  "Cruciferous Veg",
  "Squash",
  "Nightshade",
  "Mushroom",
  "Fruit",
  "Protein-Poultry",
  "Protein-RedMeat",
  "Protein-Pork",
  "Protein-Seafood",
  "Protein-Game",
  "Protein-Processed",
  "Protein-Plant",
  "Egg",
  "Dairy",
  "Starch-Potato",
  "Starch-Grain",
  "Starch-Legume",
  "Nut/Seed",
  "Herb",
  "Spice",
  "Seasoning",
  "Condiment",
  "Sauce/Paste",
  "Sweetener",
  "Fat",
  "Acid",
  "Pickle/Fermented",
  "Bread/Baked",
  "Confection",
  "Snack/Processed",
  "Liquid-Water",
  "Liquid-Broth",
  "Liquid-Dairy",
  "Liquid-Wine",
  "Liquid-Beer",
  "Liquid-Spirit",
  "Liquid-Juice",
  "Other",
]);

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    tiktokUrl: varchar("tiktok_url", { length: 500 }).notNull(),
    videoId: varchar("video_id", { length: 100 }).notNull(),
    title: text("title"),
    description: text("description"),
    author: varchar("author", { length: 100 }),
    duration: integer("duration"),
    viewCount: bigint("view_count", { mode: "number" }),
    likeCount: bigint("like_count", { mode: "number" }),
    commentCount: bigint("comment_count", { mode: "number" }),
    shareCount: bigint("share_count", { mode: "number" }),
    fileSize: bigint("file_size", { mode: "number" }),
    b2Key: varchar("b2_key", { length: 500 }),
    isAboutStew: boolean("is_about_stew"),
    processingStatus: processingStatusEnum("processing_status").default("unprocessed").notNull(),
    downloadDate: timestamp("download_date", { mode: "string" }).defaultNow(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("videos_tiktok_url_unique").on(table.tiktokUrl),
    uniqueIndex("videos_video_id_unique").on(table.videoId),
    index("videos_processing_status_idx").on(table.processingStatus),
  ],
);

export const stewAnalysis = pgTable(
  "stew_analysis",
  {
    analysisId: serial("analysis_id").primaryKey(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    videoDay: integer("video_day").notNull(),
    creatorSentiment: creatorSentimentEnum("creator_sentiment").notNull(),
    ratingOverall: numeric("rating_overall", { precision: 3, scale: 1 }),
    ratingRichness: numeric("rating_richness", { precision: 3, scale: 1 }),
    ratingComplexity: numeric("rating_complexity", { precision: 3, scale: 1 }),
    ratingOverallConfidence: integer("rating_overall_confidence"),
    ratingRichnessConfidence: integer("rating_richness_confidence"),
    ratingComplexityConfidence: integer("rating_complexity_confidence"),
    flavorProfileNotes: text("flavor_profile_notes"),
    textureThickness: numeric("texture_thickness", { precision: 3, scale: 1 }),
    appearanceColor: text("appearance_color"),
    appearanceClarity: numeric("appearance_clarity", { precision: 3, scale: 1 }),
    keyQuote: text("key_quote"),
    generalNotes: text("general_notes").notNull(),
    ratingInferred: boolean("rating_inferred").default(false).notNull(),
    richnessInferred: boolean("richness_inferred").default(false).notNull(),
    complexityInferred: boolean("complexity_inferred").default(false).notNull(),
    rawGeminiResponse: text("raw_gemini_response"),
    analysisModel: text("analysis_model"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("stew_analysis_video_id_unique").on(table.videoId),
    index("stew_analysis_video_day_idx").on(table.videoDay),
    check("rating_overall_range", sql`${table.ratingOverall} IS NULL OR (${table.ratingOverall} >= 0 AND ${table.ratingOverall} <= 20)`),
    check("rating_richness_range", sql`${table.ratingRichness} IS NULL OR (${table.ratingRichness} >= 0 AND ${table.ratingRichness} <= 20)`),
    check("rating_complexity_range", sql`${table.ratingComplexity} IS NULL OR (${table.ratingComplexity} >= 0 AND ${table.ratingComplexity} <= 20)`),
    check("texture_thickness_range", sql`${table.textureThickness} IS NULL OR (${table.textureThickness} >= 0 AND ${table.textureThickness} <= 20)`),
    check("appearance_clarity_range", sql`${table.appearanceClarity} IS NULL OR (${table.appearanceClarity} >= 0 AND ${table.appearanceClarity} <= 20)`),
  ],
);

export const ingredients = pgTable("ingredients", {
  ingredientId: serial("ingredient_id").primaryKey(),
  ingredientName: text("ingredient_name").notNull().unique(),
  ingredientCategory: ingredientCategoryEnum("ingredient_category").notNull(),
});

export const ingredientAdditions = pgTable(
  "ingredient_additions",
  {
    additionId: serial("addition_id").primaryKey(),
    analysisId: integer("analysis_id")
      .notNull()
      .references(() => stewAnalysis.analysisId, { onDelete: "cascade" }),
    ingredientId: integer("ingredient_id")
      .notNull()
      .references(() => ingredients.ingredientId, { onDelete: "cascade" }),
    prepStyle: prepStyleEnum("prep_style").notNull(),
    comment: text("comment"),
  },
  (table) => [
    index("ingredient_additions_analysis_idx").on(table.analysisId),
    index("ingredient_additions_ingredient_idx").on(table.ingredientId),
  ],
);

export const videoTranscripts = pgTable(
  "video_transcripts",
  {
    transcriptId: serial("transcript_id").primaryKey(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    transcriptText: text("transcript_text").notNull(),
    language: varchar("language", { length: 16 }).default("en"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("video_transcripts_video_id_unique").on(table.videoId),
  ],
);

export const videoSummaryEmbeddings = pgTable(
  "video_summary_embeddings",
  {
    id: serial("id").primaryKey(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    summaryText: text("summary_text").notNull(),
    model: text("model").notNull(),
    dimensions: integer("dimensions").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("video_summary_embeddings_video_id_unique").on(table.videoId),
  ],
);
