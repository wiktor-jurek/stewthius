#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "../../lib/db/client";
import { downloadFromB2 } from "../../lib/b2";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const GEMINI_EMBED_MODEL =
  process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const PROCESS_LIMIT = Number.parseInt(process.env.PROCESS_LIMIT || "0", 10);
const VIDEOS_DIR = process.env.VIDEOS_DIR || "data/videos";
const EMBEDDING_DIMENSIONS = Number.parseInt(
  process.env.EMBEDDING_DIMENSIONS || "768",
  10,
);
const INGREDIENT_MATCH_THRESHOLD = Number.parseFloat(
  process.env.INGREDIENT_MATCH_THRESHOLD || "0.8",
);
const MAX_ANALYSIS_RETRIES = Number.parseInt(
  process.env.MAX_ANALYSIS_RETRIES || "2",
  10,
);

if (!GEMINI_API_KEY) {
  console.error("Missing required env var: GEMINI_API_KEY");
  process.exit(1);
}

const SYSTEM_PROMPT = `
You are a meticulous data analyst AI for a perpetual stew project.
The creator sometimes posts videos unrelated to the perpetual stew.
First determine whether the video is about the perpetual stew (is_about_stew).
If it is NOT about the stew, set is_about_stew to false and fill the remaining fields with sensible defaults (video_day=0, empty arrays, nulls).
If it IS about the stew, extract data with high precision.
For creator_sentiment, use the 5-level scale: "Super Negative" for disgust/despair, "Negative" for disappointment, "Neutral" for indifference, "Positive" for satisfaction, "Super Positive" for excitement/euphoria.
`;

const SENTIMENT_ENUM = [
  "Super Positive",
  "Positive",
  "Neutral",
  "Negative",
  "Super Negative",
] as const;
const INGREDIENT_CATEGORY_ENUM = [
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
] as const;
const PREP_STYLE_ENUM = [
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
] as const;

const ANALYSIS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "is_about_stew",
    "video_day",
    "creator_sentiment",
    "transcript",
    "sensory_ratings",
    "physical_properties",
    "ingredient_additions",
    "process_and_context",
  ],
  properties: {
    is_about_stew: {
      type: "BOOLEAN",
      description:
        "True if this video is about the perpetual stew project. False if the creator is making unrelated content (e.g. a different recipe, vlog, etc.).",
    },
    video_day: { type: "NUMBER" },
    creator_sentiment: { type: "STRING", enum: [...SENTIMENT_ENUM] },
    transcript: {
      type: "OBJECT",
      required: ["language", "full_text"],
      properties: {
        language: { type: "STRING", nullable: true },
        full_text: { type: "STRING" },
      },
    },
    sensory_ratings: {
      type: "OBJECT",
      required: [
        "rating_overall",
        "rating_richness",
        "rating_complexity",
        "rating_overall_confidence",
        "rating_richness_confidence",
        "rating_complexity_confidence",
        "rating_overall_reasoning",
        "rating_richness_reasoning",
        "rating_complexity_reasoning",
        "flavor_profile_notes",
      ],
      properties: {
        rating_overall: {
          type: "NUMBER",
          nullable: true,
          description:
            "Rate stew overall from 0-10 where 0 is inedible and 10 is excellent. The creator rates out of 10.",
        },
        rating_richness: {
          type: "NUMBER",
          nullable: true,
          description:
            "Rate richness from 0-10 where 0 is watery/thin flavor and 10 is deeply rich and full-bodied.",
        },
        rating_complexity: {
          type: "NUMBER",
          nullable: true,
          description:
            "Rate complexity from 0-10 where 0 is one-note and 10 is highly layered flavor.",
        },
        rating_overall_confidence: {
          type: "NUMBER",
          description:
            "Confidence from 1-100 for rating_overall. 100 means explicitly stated by creator.",
        },
        rating_richness_confidence: {
          type: "NUMBER",
          description:
            "Confidence from 1-100 for rating_richness. 100 means explicitly stated by creator.",
        },
        rating_complexity_confidence: {
          type: "NUMBER",
          description:
            "Confidence from 1-100 for rating_complexity. 100 means explicitly stated by creator.",
        },
        rating_overall_reasoning: {
          type: "STRING",
          nullable: true,
          description: "Short evidence-based reason for rating_overall.",
        },
        rating_richness_reasoning: {
          type: "STRING",
          nullable: true,
          description: "Short evidence-based reason for rating_richness.",
        },
        rating_complexity_reasoning: {
          type: "STRING",
          nullable: true,
          description: "Short evidence-based reason for rating_complexity.",
        },
        flavor_profile_notes: { type: "STRING", nullable: true },
      },
    },
    physical_properties: {
      type: "OBJECT",
      required: ["texture_thickness", "appearance_color", "appearance_clarity"],
      properties: {
        texture_thickness: {
          type: "NUMBER",
          nullable: true,
          description:
            "Rate 1-10. 1 = water-like broth, 5 = thick gravy, 10 = near-solid/paste.",
        },
        appearance_color: { type: "STRING", nullable: true },
        appearance_clarity: {
          type: "NUMBER",
          nullable: true,
          description:
            "Rate 1-10. 1 = very cloudy/opaque, 5 = semi-cloudy, 10 = very clear/transparent.",
        },
      },
    },
    ingredient_additions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["ingredient_name", "ingredient_category", "prep_style"],
        properties: {
          ingredient_name: { type: "STRING" },
          ingredient_category: {
            type: "STRING",
            enum: [...INGREDIENT_CATEGORY_ENUM],
          },
          prep_style: { type: "STRING", enum: [...PREP_STYLE_ENUM] },
          comment: {
            type: "STRING",
            nullable: true,
            description:
              "Optional noteworthy comment about why this ingredient was added or what effect the creator expects, in the creator's own words if possible. Only include if the creator says something meaningful about this specific ingredient.",
          },
        },
      },
    },
    process_and_context: {
      type: "OBJECT",
      required: ["key_quote", "general_notes"],
      properties: {
        key_quote: { type: "STRING", nullable: true },
        general_notes: { type: "STRING" },
      },
    },
  },
} as const;

type AnalysisOutput = {
  is_about_stew: boolean;
  video_day: number;
  creator_sentiment:
    | "Super Positive"
    | "Positive"
    | "Neutral"
    | "Negative"
    | "Super Negative";
  transcript: {
    language: string | null;
    full_text: string;
  };
  sensory_ratings: {
    rating_overall: number | null;
    rating_richness: number | null;
    rating_complexity: number | null;
    rating_overall_confidence: number;
    rating_richness_confidence: number;
    rating_complexity_confidence: number;
    rating_overall_reasoning: string | null;
    rating_richness_reasoning: string | null;
    rating_complexity_reasoning: string | null;
    flavor_profile_notes: string | null;
  };
  physical_properties: {
    texture_thickness: number | null;
    appearance_color: string | null;
    appearance_clarity: number | null;
  };
  ingredient_additions: Array<{
    ingredient_name: string;
    ingredient_category: string;
    prep_style: string;
    comment: string | null;
  }>;
  process_and_context: {
    key_quote: string | null;
    general_notes: string;
  };
};

type ExistingIngredient = {
  id: number;
  name: string;
  category: string;
  canonicalName: string;
  normalizedName: string;
};

type IngredientResolverState = {
  existingIngredients: ExistingIngredient[];
  threshold: number;
};

const INGREDIENT_STOPWORDS = new Set([
  "fresh",
  "organic",
  "diced",
  "chopped",
  "minced",
  "sliced",
  "julienned",
  "peeled",
  "crushed",
  "ground",
  "whole",
  "large",
  "small",
  "extra",
  "virgin",
  "optional",
  "to",
  "taste",
]);

const INGREDIENT_SYNONYMS: Record<string, string> = {
  scallions: "green onion",
  "spring onion": "green onion",
  garbanzo: "chickpea",
  "garbanzo bean": "chickpea",
  "garbanzo beans": "chickpea",
  cilantro: "coriander",
};

function capitalizeFirst(name: string) {
  const trimmed = String(name || "")
    .trim()
    .toLowerCase();
  if (!trimmed) {
    return "";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function singularizeWord(word: string) {
  if (word.endsWith("ies") && word.length > 3) {
    return `${word.slice(0, -3)}y`;
  }
  if (/(?:sh|ch|x|z|s)es$/.test(word) && word.length > 3) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 2) {
    return word.slice(0, -1);
  }
  return word;
}

function canonicalizeIngredientName(input: string) {
  const cleaned = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  const tokens = cleaned
    .split(" ")
    .filter((token) => token && !INGREDIENT_STOPWORDS.has(token))
    .map((token) => singularizeWord(token));

  const joined = tokens.join(" ").trim();
  if (!joined) {
    return "";
  }

  const synonymResolved = INGREDIENT_SYNONYMS[joined] ?? joined;
  return capitalizeFirst(synonymResolved);
}

type PrepStyle = (typeof PREP_STYLE_ENUM)[number];
type IngredientCategory = (typeof INGREDIENT_CATEGORY_ENUM)[number];

const VALID_PREP_STYLES = new Set<string>(PREP_STYLE_ENUM);
const VALID_INGREDIENT_CATEGORIES = new Set<string>(INGREDIENT_CATEGORY_ENUM);

function validatePrepStyle(value: string): PrepStyle {
  return VALID_PREP_STYLES.has(value) ? (value as PrepStyle) : "Raw";
}

function validateIngredientCategory(value: string): IngredientCategory {
  return VALID_INGREDIENT_CATEGORIES.has(value)
    ? (value as IngredientCategory)
    : "Other";
}

async function getExistingIngredients() {
  const rows = await db
    .select({
      id: schema.ingredients.ingredientId,
      name: schema.ingredients.ingredientName,
      category: schema.ingredients.ingredientCategory,
    })
    .from(schema.ingredients)
    .orderBy(asc(schema.ingredients.ingredientName));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    canonicalName: canonicalizeIngredientName(row.name),
    normalizedName: capitalizeFirst(row.name),
  }));
}

async function getTargetVideos(opts: {
  includeProcessedWithoutTranscript: boolean;
  reprocessFailed: boolean;
}) {
  const statusConditions = [eq(schema.videos.processingStatus, "unprocessed")];

  if (opts.includeProcessedWithoutTranscript) {
    statusConditions.push(
      and(
        eq(schema.videos.processingStatus, "analyzed"),
        isNull(schema.videoTranscripts.transcriptId),
      )!,
    );
  }

  if (opts.reprocessFailed) {
    statusConditions.push(eq(schema.videos.processingStatus, "failed"));
  }

  const query = db
    .select({
      id: schema.videos.id,
      videoId: schema.videos.videoId,
      b2Key: schema.videos.b2Key,
      title: schema.videos.title,
    })
    .from(schema.videos)
    .leftJoin(
      schema.videoTranscripts,
      eq(schema.videoTranscripts.videoId, schema.videos.id),
    )
    .where(
      statusConditions.length > 1
        ? or(...statusConditions)
        : statusConditions[0],
    )
    .orderBy(asc(schema.videos.id));

  if (PROCESS_LIMIT > 0) {
    query.limit(PROCESS_LIMIT);
  }

  return query;
}

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
};

function inferMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || "video/mp4";
}

async function loadVideoFile(
  videoId: string,
  b2Key: string | null,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (b2Key) {
    console.log(`  Downloading from B2: ${b2Key}`);
    const buffer = await downloadFromB2(b2Key);
    return { buffer, mimeType: inferMimeType(b2Key) };
  }

  const entries = await fs.readdir(VIDEOS_DIR, { withFileTypes: true });
  const match = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .find(
      (name) => name.startsWith(`${videoId}.`) && !name.endsWith(".info.json"),
    );

  if (!match) {
    throw new Error(
      `Video file not found for ${videoId} (no B2 key, no local file)`,
    );
  }
  return {
    buffer: await fs.readFile(path.join(VIDEOS_DIR, match)),
    mimeType: inferMimeType(match),
  };
}

function stripJsonFence(text: string) {
  if (!text) {
    return "";
  }
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }

    if (attempt < maxRetries) {
      const backoffMs = Math.min(1000 * 2 ** attempt, 30_000);
      const retryAfter = response.headers.get("retry-after");
      const waitMs = retryAfter
        ? Number(retryAfter) * 1000 || backoffMs
        : backoffMs;
      console.warn(
        `Retryable HTTP ${response.status}, waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${maxRetries + 1})`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    return response;
  }

  throw new Error("Exhausted HTTP retries");
}

async function analyzeWithGemini(videoBase64: string, mimeType: string) {
  const userPrompt = `
First, determine if this video is about the perpetual stew project (is_about_stew).
If the video is NOT about the perpetual stew, set is_about_stew=false and use defaults for the rest.
If it IS about the stew, extract structured data:
- Extract ingredient_additions[].ingredient_name as a singular base ingredient (for example: "Carrot", not "Diced organic carrots").
- For each ingredient, include a comment if the creator says something noteworthy about why they're adding it or what effect they expect (e.g. "To add saltiness and spice"). Use their own words when possible. Leave null if nothing notable is said.
- All rating_* values are on a 0-10 scale because the creator usually rates the stew out of 10.
- For each main rating, include a confidence score (1-100) and brief evidence-based reasoning.
- Always include transcript.full_text when speech can be inferred from audio.
- If no ingredients are added, return an empty ingredient_additions array.
`;

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY || "")}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: videoBase64,
                },
              },
              { text: userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || "";
  const rawJson = stripJsonFence(text);
  return {
    parsed: JSON.parse(rawJson) as AnalysisOutput,
    raw: rawJson,
  };
}

async function getEmbedding(textValue: string) {
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_EMBED_MODEL)}:embedContent?key=${encodeURIComponent(GEMINI_API_KEY || "")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{ text: textValue }],
        },
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

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildSummaryParagraph(
  day: number,
  sentiment: string,
  ratings: {
    overall?: number | null;
    richness?: number | null;
    complexity?: number | null;
  },
  ingredientNames: string[],
  flavorNotes: string | null | undefined,
  transcriptText: string,
): string {
  const lines: string[] = [`Day ${day} Summary:`];

  const overall = ratings.overall != null ? `${ratings.overall}/10` : "N/A";
  const richness = ratings.richness != null ? `${ratings.richness}/10` : "N/A";
  const complexity =
    ratings.complexity != null ? `${ratings.complexity}/10` : "N/A";
  lines.push(
    `Metrics: Overall Rating: ${overall}. Richness: ${richness}. Complexity: ${complexity}.`,
  );

  lines.push(`Vibe: Creator Sentiment is ${sentiment}.`);

  if (ingredientNames.length > 0) {
    lines.push(`Ingredients Added: ${ingredientNames.join(", ")}.`);
  } else {
    lines.push("Ingredients Added: None.");
  }

  if (flavorNotes) {
    lines.push(`Flavor Notes: ${flavorNotes}`);
  }

  if (transcriptText) {
    const maxTranscript = 800;
    const truncated =
      transcriptText.length > maxTranscript
        ? `${transcriptText.slice(0, maxTranscript)}...`
        : transcriptText;
    lines.push(`Transcript: "${truncated}"`);
  }

  return lines.join("\n");
}

function getLevenshteinDistance(a: string, b: string) {
  const source = a.toLowerCase();
  const target = b.toLowerCase();

  if (source === target) {
    return 0;
  }
  if (!source.length) {
    return target.length;
  }
  if (!target.length) {
    return source.length;
  }

  const previous = new Array(target.length + 1).fill(0);
  const current = new Array(target.length + 1).fill(0);

  for (let j = 0; j <= target.length; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= target.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[target.length];
}

function getStringSimilarity(a: string, b: string) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) {
    return 1;
  }
  const distance = getLevenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

function getInvalidRatingReasons(analysisData: AnalysisOutput) {
  const checks: Array<[string, unknown]> = [
    ["rating_overall", analysisData.sensory_ratings.rating_overall],
    ["rating_richness", analysisData.sensory_ratings.rating_richness],
    ["rating_complexity", analysisData.sensory_ratings.rating_complexity],
  ];

  const issues: string[] = [];
  for (const [field, value] of checks) {
    const n = toNullableNumber(value);
    if (n === null) {
      continue;
    }
    if (n < 0 || n > 20) {
      issues.push(`${field}=${n} (expected 0-20)`);
    }
  }
  return issues;
}

async function analyzeWithGeminiWithRetries(
  videoBase64: string,
  mimeType: string,
  maxRetries: number,
) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const result = await analyzeWithGemini(videoBase64, mimeType);
    const invalidRatingReasons = getInvalidRatingReasons(result.parsed);

    if (invalidRatingReasons.length === 0) {
      return result;
    }

    if (attempt < maxRetries) {
      console.warn(
        `Invalid rating values from Gemini (attempt ${attempt + 1}/${maxRetries + 1}), retrying: ${invalidRatingReasons.join(", ")}`,
      );
      attempt += 1;
      continue;
    }

    throw new Error(
      `Gemini produced invalid rating values after ${maxRetries + 1} attempt(s): ${invalidRatingReasons.join(", ")}`,
    );
  }

  throw new Error("Unreachable");
}

function findBestIngredientMatch(
  rawName: string,
  state: IngredientResolverState,
) {
  const canonicalName = canonicalizeIngredientName(rawName);
  if (!canonicalName) {
    return null;
  }

  const exact = state.existingIngredients.find(
    (item) =>
      item.canonicalName === canonicalName ||
      item.normalizedName === canonicalName,
  );
  if (exact) {
    return exact;
  }

  let bestMatch: ExistingIngredient | null = null;
  let bestScore = 0;
  for (const item of state.existingIngredients) {
    const score = getStringSimilarity(
      canonicalName,
      item.canonicalName || item.normalizedName,
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore >= state.threshold) {
    return bestMatch;
  }

  return null;
}

async function getOrCreateIngredient(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  state: IngredientResolverState,
  ingredientName: string,
  ingredientCategory: string,
) {
  const canonicalName = canonicalizeIngredientName(ingredientName);
  if (!canonicalName) {
    return null;
  }

  const fuzzyMatch = findBestIngredientMatch(canonicalName, state);
  if (fuzzyMatch) {
    return fuzzyMatch.id;
  }

  const validCategory = validateIngredientCategory(
    ingredientCategory || "Other",
  );
  const created = await tx
    .insert(schema.ingredients)
    .values({
      ingredientName: canonicalName,
      ingredientCategory: validCategory,
    })
    .returning({ id: schema.ingredients.ingredientId });

  const createdId = created[0]?.id ?? null;
  if (createdId) {
    state.existingIngredients.push({
      id: createdId,
      name: canonicalName,
      category: validCategory,
      canonicalName,
      normalizedName: canonicalName,
    });
  }

  return createdId;
}

async function saveFullAnalysis(
  videoDbId: number,
  analysisData: AnalysisOutput,
  rawGeminiResponse: string,
  ingredientResolverState: IngredientResolverState,
) {
  const transcriptText = String(analysisData.transcript.full_text || "").trim();
  const ratingOverallConfidence = toNullableNumber(
    analysisData.sensory_ratings.rating_overall_confidence,
  );
  const ratingRichnessConfidence = toNullableNumber(
    analysisData.sensory_ratings.rating_richness_confidence,
  );
  const ratingComplexityConfidence = toNullableNumber(
    analysisData.sensory_ratings.rating_complexity_confidence,
  );
  const ratingInferred =
    ratingOverallConfidence === null ? true : ratingOverallConfidence < 100;
  const richnessInferred =
    ratingRichnessConfidence === null ? true : ratingRichnessConfidence < 100;
  const complexityInferred =
    ratingComplexityConfidence === null
      ? true
      : ratingComplexityConfidence < 100;

  const toConfidenceInt = (v: number | null) =>
    v != null ? Math.round(v) : null;

  const analysisValues = {
    videoDay: analysisData.video_day,
    creatorSentiment: analysisData.creator_sentiment,
    ratingOverall:
      toNullableNumber(
        analysisData.sensory_ratings.rating_overall,
      )?.toString() ?? null,
    ratingRichness:
      toNullableNumber(
        analysisData.sensory_ratings.rating_richness,
      )?.toString() ?? null,
    ratingComplexity:
      toNullableNumber(
        analysisData.sensory_ratings.rating_complexity,
      )?.toString() ?? null,
    ratingOverallConfidence: toConfidenceInt(ratingOverallConfidence),
    ratingRichnessConfidence: toConfidenceInt(ratingRichnessConfidence),
    ratingComplexityConfidence: toConfidenceInt(ratingComplexityConfidence),
    flavorProfileNotes:
      analysisData.sensory_ratings.flavor_profile_notes ?? null,
    textureThickness:
      toNullableNumber(
        analysisData.physical_properties.texture_thickness,
      )?.toString() ?? null,
    appearanceColor: analysisData.physical_properties.appearance_color ?? null,
    appearanceClarity:
      toNullableNumber(
        analysisData.physical_properties.appearance_clarity,
      )?.toString() ?? null,
    keyQuote: analysisData.process_and_context.key_quote ?? null,
    generalNotes:
      analysisData.process_and_context.general_notes ?? "No notes provided.",
    ratingInferred,
    richnessInferred,
    complexityInferred,
    rawGeminiResponse,
    analysisModel: GEMINI_MODEL,
  };

  const additions = analysisData.ingredient_additions;
  const ingredientNames = additions
    .map((a) => a.ingredient_name)
    .filter(Boolean);

  const summaryText = buildSummaryParagraph(
    analysisData.video_day,
    analysisData.creator_sentiment,
    {
      overall: toNullableNumber(analysisData.sensory_ratings.rating_overall),
      richness: toNullableNumber(analysisData.sensory_ratings.rating_richness),
      complexity: toNullableNumber(
        analysisData.sensory_ratings.rating_complexity,
      ),
    },
    ingredientNames,
    analysisData.sensory_ratings.flavor_profile_notes,
    transcriptText,
  );

  const summaryEmbedding = await getEmbedding(summaryText);

  await db.transaction(async (tx) => {
    const upserted = await tx
      .insert(schema.stewAnalysis)
      .values({ videoId: videoDbId, ...analysisValues })
      .onConflictDoUpdate({
        target: schema.stewAnalysis.videoId,
        set: { ...analysisValues, updatedAt: sql`CURRENT_TIMESTAMP` },
      })
      .returning({ analysisId: schema.stewAnalysis.analysisId });

    const analysisId = upserted[0].analysisId;

    await tx
      .delete(schema.ingredientAdditions)
      .where(eq(schema.ingredientAdditions.analysisId, analysisId));

    const resolvedAdditions = [];
    for (const addition of additions) {
      const ingredientId = await getOrCreateIngredient(
        tx,
        ingredientResolverState,
        addition.ingredient_name,
        addition.ingredient_category,
      );
      if (ingredientId) {
        resolvedAdditions.push({
          analysisId,
          ingredientId,
          prepStyle: validatePrepStyle(addition.prep_style || "Raw"),
          comment: addition.comment?.trim() || null,
        });
      }
    }

    if (resolvedAdditions.length > 0) {
      await tx.insert(schema.ingredientAdditions).values(resolvedAdditions);
    }

    if (transcriptText) {
      await tx
        .insert(schema.videoTranscripts)
        .values({
          videoId: videoDbId,
          model: GEMINI_MODEL,
          transcriptText,
          language: analysisData.transcript.language || "en",
        })
        .onConflictDoUpdate({
          target: schema.videoTranscripts.videoId,
          set: {
            model: GEMINI_MODEL,
            transcriptText,
            language: analysisData.transcript.language || "en",
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
    }

    await tx
      .insert(schema.videoSummaryEmbeddings)
      .values({
        videoId: videoDbId,
        summaryText,
        model: GEMINI_EMBED_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        embedding: summaryEmbedding,
      })
      .onConflictDoUpdate({
        target: schema.videoSummaryEmbeddings.videoId,
        set: {
          summaryText,
          model: GEMINI_EMBED_MODEL,
          dimensions: EMBEDDING_DIMENSIONS,
          embedding: summaryEmbedding,
          createdAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    await tx
      .update(schema.videos)
      .set({
        isAboutStew: true,
        processingStatus: "analyzed",
      })
      .where(eq(schema.videos.id, videoDbId));
  });
}

type RunAnalyzeTaskOptions = {
  includeProcessedWithoutTranscript?: boolean;
  reprocessFailed?: boolean;
};

export async function runAnalyzeTask(options: RunAnalyzeTaskOptions = {}) {
  const startedAt = Date.now();
  const includeProcessedWithoutTranscript = Boolean(
    options.includeProcessedWithoutTranscript,
  );
  const reprocessFailed = Boolean(options.reprocessFailed);
  const normalizedMatchThreshold = Number.isFinite(INGREDIENT_MATCH_THRESHOLD)
    ? Math.min(1, Math.max(0, INGREDIENT_MATCH_THRESHOLD))
    : 0.8;
  const normalizedAnalysisRetries = Number.isFinite(MAX_ANALYSIS_RETRIES)
    ? Math.max(0, Math.min(5, MAX_ANALYSIS_RETRIES))
    : 2;

  const videos = await getTargetVideos({
    includeProcessedWithoutTranscript,
    reprocessFailed,
  });
  if (videos.length === 0) {
    console.log("No target videos found.");
    return;
  }

  console.log(
    `Processing ${videos.length} video(s) with Gemini model ${GEMINI_MODEL}`,
  );
  const ingredientResolverState: IngredientResolverState = {
    existingIngredients: await getExistingIngredients(),
    threshold: normalizedMatchThreshold,
  };
  let success = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i += 1) {
    const video = videos[i];
    console.log(
      `[${i + 1}/${videos.length}] Processing video_id=${video.videoId}`,
    );

    try {
      const { buffer, mimeType } = await loadVideoFile(
        video.videoId,
        video.b2Key,
      );
      const base64Video = buffer.toString("base64");

      const { parsed, raw } = await analyzeWithGeminiWithRetries(
        base64Video,
        mimeType,
        normalizedAnalysisRetries,
      );

      if (!parsed.is_about_stew) {
        await db
          .update(schema.videos)
          .set({ isAboutStew: false, processingStatus: "analyzed" })
          .where(eq(schema.videos.id, video.id));
        console.log(`Skipped video ${video.videoId} (not about stew)`);
        success += 1;
        continue;
      }

      await saveFullAnalysis(video.id, parsed, raw, ingredientResolverState);

      success += 1;
      console.log(`Processed video ${video.videoId}`);
    } catch (error) {
      failed += 1;
      await db
        .update(schema.videos)
        .set({ processingStatus: "failed" })
        .where(eq(schema.videos.id, video.id));
      console.error(`Failed video ${video.videoId}:`, error);
    }
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `Analysis task done. Success=${success} Failed=${failed} Elapsed=${Math.round(elapsedMs / 1000)}s`,
  );
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const args = new Set(process.argv.slice(2));
  runAnalyzeTask({
    reprocessFailed: args.has("--reprocess-failed"),
    includeProcessedWithoutTranscript: args.has("--backfill-transcripts"),
  }).catch((error) => {
    console.error("Analyzer task failed:", error);
    process.exitCode = 1;
  });
}
