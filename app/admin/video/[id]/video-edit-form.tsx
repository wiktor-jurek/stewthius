"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateVideo,
  updateAnalysis,
  updateIngredientAddition,
  deleteIngredientAddition,
  createIngredientAddition,
} from "@/lib/admin-actions";

type Video = {
  id: number;
  tiktokUrl: string;
  videoId: string;
  title: string | null;
  description: string | null;
  author: string | null;
  isAboutStew: boolean | null;
  processingStatus: string;
  [key: string]: unknown;
};

type Analysis = {
  analysisId: number;
  videoId: number;
  videoDay: number;
  creatorSentiment: string;
  ratingOverall: string | null;
  ratingRichness: string | null;
  ratingComplexity: string | null;
  ratingInferred: boolean;
  richnessInferred: boolean;
  complexityInferred: boolean;
  textureThickness: string | null;
  appearanceColor: string | null;
  appearanceClarity: string | null;
  flavorProfileNotes: string | null;
  keyQuote: string | null;
  generalNotes: string;
  [key: string]: unknown;
} | null;

type Addition = {
  additionId: number;
  analysisId: number;
  ingredientId: number;
  ingredientName: string;
  ingredientCategory: string;
  prepStyle: string;
  comment: string | null;
  potency: number | null;
  defaultPotency: number;
};

type Ingredient = {
  ingredientId: number;
  ingredientName: string;
  ingredientCategory: string;
};

const SENTIMENTS = [
  "Super Positive",
  "Positive",
  "Neutral",
  "Negative",
  "Super Negative",
] as const;

const PREP_STYLES = [
  "Raw", "Roasted", "Sautéed", "Boiled", "Leftover", "Scrap", "Jarred",
  "Fried", "Grilled", "Smoked", "Steamed", "Braised", "Baked", "Pickled",
  "Dried", "Canned", "Frozen", "Marinated", "Fermented", "Powdered",
  "Caramelized", "Cured", "Mashed", "Confit", "Blanched", "Poached", "Infused",
] as const;

const STATUSES = ["unprocessed", "analyzed", "failed"] as const;

function SuccessMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-herb-green/10 border border-herb-green/20 px-3 py-2 text-sm text-herb-green">
      {message}
    </div>
  );
}

export function VideoEditForm({
  video,
  analysis,
  additions,
  allIngredients,
}: {
  video: Video;
  analysis: Analysis;
  additions: Addition[];
  allIngredients: Ingredient[];
}) {
  return (
    <div className="space-y-6">
      <VideoMetadataSection video={video} />
      {analysis && (
        <AnalysisSection analysis={analysis} />
      )}
      {analysis && (
        <IngredientsSection
          analysisId={analysis.analysisId}
          additions={additions}
          allIngredients={allIngredients}
        />
      )}
    </div>
  );
}

function VideoMetadataSection({ video }: { video: Video }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await updateVideo(video.id, {
        title: (formData.get("title") as string) || null,
        description: (formData.get("description") as string) || null,
        author: (formData.get("author") as string) || null,
        isAboutStew: formData.get("isAboutStew") === "true"
          ? true
          : formData.get("isAboutStew") === "false"
            ? false
            : null,
        processingStatus: formData.get("processingStatus") as "unprocessed" | "analyzed" | "failed",
      });
      setSuccess("Video metadata saved.");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SuccessMessage message={success} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title">
              <Input name="title" defaultValue={video.title ?? ""} />
            </Field>
            <Field label="Author">
              <Input name="author" defaultValue={video.author ?? ""} />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                defaultValue={video.description ?? ""}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              />
            </Field>
            <div className="space-y-4">
              <Field label="Processing Status">
                <select
                  name="processingStatus"
                  defaultValue={video.processingStatus}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Is About Stew">
                <select
                  name="isAboutStew"
                  defaultValue={
                    video.isAboutStew === true
                      ? "true"
                      : video.isAboutStew === false
                        ? "false"
                        : ""
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Metadata"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AnalysisSection({ analysis }: { analysis: NonNullable<Analysis> }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await updateAnalysis(analysis.analysisId, {
        videoDay: parseInt(fd.get("videoDay") as string, 10),
        creatorSentiment: fd.get("creatorSentiment") as typeof SENTIMENTS[number],
        ratingOverall: (fd.get("ratingOverall") as string) || null,
        ratingRichness: (fd.get("ratingRichness") as string) || null,
        ratingComplexity: (fd.get("ratingComplexity") as string) || null,
        ratingInferred: fd.get("ratingInferred") === "on",
        richnessInferred: fd.get("richnessInferred") === "on",
        complexityInferred: fd.get("complexityInferred") === "on",
        textureThickness: (fd.get("textureThickness") as string) || null,
        appearanceColor: (fd.get("appearanceColor") as string) || null,
        appearanceClarity: (fd.get("appearanceClarity") as string) || null,
        flavorProfileNotes: (fd.get("flavorProfileNotes") as string) || null,
        keyQuote: (fd.get("keyQuote") as string) || null,
        generalNotes: (fd.get("generalNotes") as string) || "",
      });
      setSuccess("Analysis saved.");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stew Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SuccessMessage message={success} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Day">
              <Input
                name="videoDay"
                type="number"
                defaultValue={analysis.videoDay}
              />
            </Field>
            <Field label="Sentiment">
              <select
                name="creatorSentiment"
                defaultValue={analysis.creatorSentiment}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {SENTIMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Rating Overall (0-20)">
              <Input
                name="ratingOverall"
                type="number"
                step="0.1"
                min="0"
                max="20"
                defaultValue={analysis.ratingOverall ?? ""}
              />
            </Field>
            <Field label="Rating Richness (0-20)">
              <Input
                name="ratingRichness"
                type="number"
                step="0.1"
                min="0"
                max="20"
                defaultValue={analysis.ratingRichness ?? ""}
              />
            </Field>
            <Field label="Rating Complexity (0-20)">
              <Input
                name="ratingComplexity"
                type="number"
                step="0.1"
                min="0"
                max="20"
                defaultValue={analysis.ratingComplexity ?? ""}
              />
            </Field>
          </div>

          <div className="flex gap-6">
            <Checkbox
              name="ratingInferred"
              label="Rating Inferred"
              defaultChecked={analysis.ratingInferred}
            />
            <Checkbox
              name="richnessInferred"
              label="Richness Inferred"
              defaultChecked={analysis.richnessInferred}
            />
            <Checkbox
              name="complexityInferred"
              label="Complexity Inferred"
              defaultChecked={analysis.complexityInferred}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Texture Thickness (0-20)">
              <Input
                name="textureThickness"
                type="number"
                step="0.1"
                min="0"
                max="20"
                defaultValue={analysis.textureThickness ?? ""}
              />
            </Field>
            <Field label="Appearance Clarity (0-20)">
              <Input
                name="appearanceClarity"
                type="number"
                step="0.1"
                min="0"
                max="20"
                defaultValue={analysis.appearanceClarity ?? ""}
              />
            </Field>
            <Field label="Appearance Color">
              <Input
                name="appearanceColor"
                defaultValue={analysis.appearanceColor ?? ""}
              />
            </Field>
          </div>

          <Field label="Key Quote">
            <textarea
              name="keyQuote"
              defaultValue={analysis.keyQuote ?? ""}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            />
          </Field>

          <Field label="Flavor Profile Notes">
            <textarea
              name="flavorProfileNotes"
              defaultValue={analysis.flavorProfileNotes ?? ""}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            />
          </Field>

          <Field label="General Notes">
            <textarea
              name="generalNotes"
              defaultValue={analysis.generalNotes ?? ""}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Analysis"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function IngredientsSection({
  analysisId,
  additions,
  allIngredients,
}: {
  analysisId: number;
  additions: Addition[];
  allIngredients: Ingredient[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete(additionId: number) {
    if (!confirm("Remove this ingredient addition?")) return;
    startTransition(async () => {
      await deleteIngredientAddition(additionId);
      router.refresh();
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedIngredient) return;
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createIngredientAddition({
        analysisId,
        ingredientId: selectedIngredient.ingredientId,
        prepStyle: fd.get("prepStyle") as string,
        comment: (fd.get("comment") as string) || null,
        potency: fd.get("potency") ? parseInt(fd.get("potency") as string, 10) : null,
      });
      setShowAdd(false);
      setSelectedIngredient(null);
      setSearch("");
      setSuccess("Ingredient added.");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    });
  }

  const filteredIngredients = search.trim()
    ? allIngredients.filter((i) =>
        i.ingredientName.toLowerCase().includes(search.toLowerCase()),
      ).slice(0, 10)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingredient Additions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SuccessMessage message={success} />
        {additions.length > 0 ? (
          <div className="space-y-3">
            {additions.map((a) => (
              <IngredientRow
                key={a.additionId}
                addition={a}
                onDelete={() => handleDelete(a.additionId)}
                disabled={isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No ingredients added for this analysis.
          </p>
        )}

        {!showAdd ? (
          <Button variant="outline" onClick={() => setShowAdd(true)}>
            + Add Ingredient
          </Button>
        ) : (
          <form
            onSubmit={handleAdd}
            className="space-y-3 p-4 rounded-lg border border-border bg-muted/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ingredient</label>
                {selectedIngredient ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedIngredient.ingredientName}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIngredient(null);
                        setSearch("");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search ingredients..."
                    />
                    {filteredIngredients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                        {filteredIngredients.map((ing) => (
                          <button
                            key={ing.ingredientId}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between"
                            onClick={() => {
                              setSelectedIngredient(ing);
                              setSearch("");
                            }}
                          >
                            <span>{ing.ingredientName}</span>
                            <span className="text-muted-foreground text-xs">
                              {ing.ingredientCategory}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Field label="Prep Style">
                <select
                  name="prepStyle"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {PREP_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Potency (0-5)">
                <Input name="potency" type="number" min="0" max="5" />
              </Field>
              <Field label="Comment">
                <Input name="comment" />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending || !selectedIngredient}>
                {isPending ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAdd(false);
                  setSelectedIngredient(null);
                  setSearch("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function IngredientRow({
  addition,
  onDelete,
  disabled,
}: {
  addition: Addition;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const hasOverride = addition.potency !== null;
  const effectivePotency = addition.potency ?? addition.defaultPotency;

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rawPotency = fd.get("potency") as string;
    const potencyValue = rawPotency.trim() === "" ? null : parseInt(rawPotency, 10);

    startTransition(async () => {
      await updateIngredientAddition(addition.additionId, {
        prepStyle: fd.get("prepStyle") as string,
        comment: (fd.get("comment") as string) || null,
        potency: potencyValue,
      });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="rounded-lg border border-ring/30 bg-accent/30 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{addition.ingredientName}</span>
            <Badge variant="secondary">{addition.ingredientCategory}</Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Prep Style">
            <select
              name="prepStyle"
              defaultValue={addition.prepStyle}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {PREP_STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label={`Potency (0-5) — default: ${addition.defaultPotency}`}>
            <div className="flex items-center gap-2">
              <Input
                name="potency"
                type="number"
                min="0"
                max="5"
                defaultValue={addition.potency ?? ""}
                placeholder={String(addition.defaultPotency)}
              />
              {addition.potency !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground whitespace-nowrap"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement?.querySelector('input[name="potency"]') as HTMLInputElement);
                    if (input) input.value = "";
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </Field>
          <Field label="Comment">
            <Input
              name="comment"
              defaultValue={addition.comment ?? ""}
            />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={disabled || isPending}
          >
            Remove
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`rounded-lg border border-border p-3 flex items-center gap-4 hover:border-border/80 transition-colors cursor-pointer group ${success ? "border-herb-green/40 bg-herb-green/5" : ""}`}
      onClick={() => setEditing(true)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{addition.ingredientName}</span>
          <Badge variant="secondary" className="text-xs">
            {addition.ingredientCategory}
          </Badge>
          <span className="text-xs text-muted-foreground">{addition.prepStyle}</span>
        </div>
        {addition.comment && (
          <p className="text-xs text-muted-foreground truncate">{addition.comment}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-sm font-semibold ${hasOverride ? "text-primary" : "text-foreground"}`}>
              {effectivePotency}
            </span>
            {hasOverride ? (
              <span className="text-xs text-primary font-medium px-1.5 py-0.5 rounded bg-primary/10">
                override
              </span>
            ) : (
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                default
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Edit
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="rounded border-input"
      />
      {label}
    </label>
  );
}
