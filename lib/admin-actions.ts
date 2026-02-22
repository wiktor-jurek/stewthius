"use server";

import { headers } from "next/headers";
import { eq, sql, asc } from "drizzle-orm";
import { auth } from "./auth";
import { db, schema } from "./db/client";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ===== Video Metadata =====

export async function getAdminVideos() {
  await requireAdmin();

  const rows = await db.execute(sql`
    SELECT
      v.id,
      v.video_id AS "videoId",
      v.tiktok_url AS "tiktokUrl",
      v.title,
      v.author,
      v.is_about_stew AS "isAboutStew",
      v.processing_status AS "processingStatus",
      v.created_at AS "createdAt",
      sa.analysis_id AS "analysisId",
      sa.video_day AS "videoDay",
      sa.creator_sentiment AS "creatorSentiment",
      sa.rating_overall AS "ratingOverall"
    FROM videos v
    LEFT JOIN stew_analysis sa ON sa.video_id = v.id
    ORDER BY COALESCE(sa.video_day, 0) DESC, v.id DESC
  `);

  return rows.rows as Array<{
    id: number;
    videoId: string;
    tiktokUrl: string;
    title: string | null;
    author: string | null;
    isAboutStew: boolean | null;
    processingStatus: string;
    createdAt: string;
    analysisId: number | null;
    videoDay: number | null;
    creatorSentiment: string | null;
    ratingOverall: string | null;
  }>;
}

export async function getAdminVideoDetail(id: number) {
  await requireAdmin();

  const videoRows = await db
    .select()
    .from(schema.videos)
    .where(eq(schema.videos.id, id))
    .limit(1);

  if (videoRows.length === 0) return null;

  const video = videoRows[0];

  const analysisRows = await db
    .select()
    .from(schema.stewAnalysis)
    .where(eq(schema.stewAnalysis.videoId, id))
    .limit(1);

  const analysis = analysisRows[0] || null;

  let additions: Array<{
    additionId: number;
    analysisId: number;
    ingredientId: number;
    ingredientName: string;
    ingredientCategory: string;
    prepStyle: string;
    comment: string | null;
    potency: number | null;
    defaultPotency: number;
  }> = [];

  if (analysis) {
    const additionRows = await db.execute(sql`
      SELECT
        ia.addition_id AS "additionId",
        ia.analysis_id AS "analysisId",
        ia.ingredient_id AS "ingredientId",
        i.ingredient_name AS "ingredientName",
        i.ingredient_category AS "ingredientCategory",
        ia.prep_style AS "prepStyle",
        ia.comment,
        ia.potency,
        i.default_potency AS "defaultPotency"
      FROM ingredient_additions ia
      JOIN ingredients i ON ia.ingredient_id = i.ingredient_id
      WHERE ia.analysis_id = ${analysis.analysisId}
      ORDER BY i.ingredient_name
    `);
    additions = additionRows.rows as typeof additions;
  }

  return { video, analysis, additions };
}

export async function updateVideo(
  id: number,
  data: {
    title?: string | null;
    description?: string | null;
    author?: string | null;
    isAboutStew?: boolean | null;
    processingStatus?: "unprocessed" | "analyzed" | "failed";
  },
) {
  await requireAdmin();

  await db
    .update(schema.videos)
    .set(data)
    .where(eq(schema.videos.id, id));

  revalidatePath("/admin");
  revalidatePath(`/admin/video/${id}`);
}

// ===== Stew Analysis =====

export async function updateAnalysis(
  analysisId: number,
  data: {
    videoDay?: number;
    creatorSentiment?:
      | "Super Positive"
      | "Positive"
      | "Neutral"
      | "Negative"
      | "Super Negative";
    ratingOverall?: string | null;
    ratingRichness?: string | null;
    ratingComplexity?: string | null;
    ratingInferred?: boolean;
    richnessInferred?: boolean;
    complexityInferred?: boolean;
    textureThickness?: string | null;
    appearanceColor?: string | null;
    appearanceClarity?: string | null;
    flavorProfileNotes?: string | null;
    keyQuote?: string | null;
    generalNotes?: string;
  },
) {
  await requireAdmin();

  await db
    .update(schema.stewAnalysis)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.stewAnalysis.analysisId, analysisId));

  revalidatePath("/admin");
}

// ===== Ingredient Additions =====

export async function updateIngredientAddition(
  additionId: number,
  data: {
    prepStyle?: string;
    comment?: string | null;
    potency?: number | null;
  },
) {
  await requireAdmin();

  await db
    .update(schema.ingredientAdditions)
    .set({
      ...(data.prepStyle !== undefined && {
        prepStyle: data.prepStyle as typeof schema.prepStyleEnum.enumValues[number],
      }),
      ...(data.comment !== undefined && { comment: data.comment }),
      ...(data.potency !== undefined && { potency: data.potency }),
    })
    .where(eq(schema.ingredientAdditions.additionId, additionId));

  revalidatePath("/admin");
}

export async function deleteIngredientAddition(additionId: number) {
  await requireAdmin();

  await db
    .delete(schema.ingredientAdditions)
    .where(eq(schema.ingredientAdditions.additionId, additionId));

  revalidatePath("/admin");
}

export async function createIngredientAddition(data: {
  analysisId: number;
  ingredientId: number;
  prepStyle: string;
  comment?: string | null;
  potency?: number | null;
}) {
  await requireAdmin();

  await db.insert(schema.ingredientAdditions).values({
    analysisId: data.analysisId,
    ingredientId: data.ingredientId,
    prepStyle: data.prepStyle as typeof schema.prepStyleEnum.enumValues[number],
    comment: data.comment || null,
    potency: data.potency || null,
  });

  revalidatePath("/admin");
}

export async function getAllIngredients() {
  await requireAdmin();

  const rows = await db
    .select({
      ingredientId: schema.ingredients.ingredientId,
      ingredientName: schema.ingredients.ingredientName,
      ingredientCategory: schema.ingredients.ingredientCategory,
      defaultPotency: schema.ingredients.defaultPotency,
    })
    .from(schema.ingredients)
    .orderBy(asc(schema.ingredients.ingredientName));

  return rows;
}

export async function updateIngredient(
  ingredientId: number,
  data: {
    ingredientName?: string;
    ingredientCategory?: string;
    defaultPotency?: number;
  },
) {
  await requireAdmin();

  await db
    .update(schema.ingredients)
    .set({
      ...(data.ingredientName !== undefined && { ingredientName: data.ingredientName }),
      ...(data.ingredientCategory !== undefined && {
        ingredientCategory: data.ingredientCategory as typeof schema.ingredientCategoryEnum.enumValues[number],
      }),
      ...(data.defaultPotency !== undefined && { defaultPotency: data.defaultPotency }),
    })
    .where(eq(schema.ingredients.ingredientId, ingredientId));

  revalidatePath("/admin/ingredients");
}

export async function createIngredient(data: {
  ingredientName: string;
  ingredientCategory: string;
  defaultPotency: number;
}) {
  await requireAdmin();

  await db.insert(schema.ingredients).values({
    ingredientName: data.ingredientName,
    ingredientCategory: data.ingredientCategory as typeof schema.ingredientCategoryEnum.enumValues[number],
    defaultPotency: data.defaultPotency,
  });

  revalidatePath("/admin/ingredients");
}

export async function deleteIngredient(ingredientId: number) {
  await requireAdmin();

  await db
    .delete(schema.ingredients)
    .where(eq(schema.ingredients.ingredientId, ingredientId));

  revalidatePath("/admin/ingredients");
}
