"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateIngredient,
  createIngredient,
  deleteIngredient,
} from "@/lib/admin-actions";

type IngredientRow = {
  ingredientId: number;
  ingredientName: string;
  ingredientCategory: string;
  defaultPotency: number;
};

const CATEGORIES = [
  "Aromatic Veg", "Root Veg", "Leafy Green", "Cruciferous Veg", "Squash",
  "Nightshade", "Mushroom", "Fruit", "Protein-Poultry", "Protein-RedMeat",
  "Protein-Pork", "Protein-Seafood", "Protein-Game", "Protein-Processed",
  "Protein-Plant", "Egg", "Dairy", "Starch-Potato", "Starch-Grain",
  "Starch-Legume", "Nut/Seed", "Herb", "Spice", "Seasoning", "Condiment",
  "Sauce/Paste", "Sweetener", "Fat", "Acid", "Pickle/Fermented",
  "Bread/Baked", "Confection", "Snack/Processed", "Liquid-Water",
  "Liquid-Broth", "Liquid-Dairy", "Liquid-Wine", "Liquid-Beer",
  "Liquid-Spirit", "Liquid-Juice", "Other",
] as const;

export function IngredientsManager({
  ingredients,
}: {
  ingredients: IngredientRow[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let result = ingredients;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.ingredientName.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter((i) => i.ingredientCategory === categoryFilter);
    }
    return result;
  }, [ingredients, search, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(ingredients.map((i) => i.ingredientCategory));
    return [...cats].sort();
  }, [ingredients]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button variant="outline" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "+ Add Ingredient"}
        </Button>
      </div>

      {showAdd && (
        <AddIngredientForm onDone={() => setShowAdd(false)} />
      )}

      <div className="space-y-2">
        {filtered.map((ing) => (
          <IngredientRowItem key={ing.ingredientId} ingredient={ing} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No ingredients found.
          </p>
        )}
      </div>
    </div>
  );
}

function IngredientRowItem({ ingredient }: { ingredient: IngredientRow }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await updateIngredient(ingredient.ingredientId, {
        ingredientName: fd.get("name") as string,
        ingredientCategory: fd.get("category") as string,
        defaultPotency: parseInt(fd.get("defaultPotency") as string, 10),
      });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${ingredient.ingredientName}"? This will also remove all its additions.`)) return;
    startTransition(async () => {
      await deleteIngredient(ingredient.ingredientId);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="rounded-lg border border-ring/30 bg-accent/30 p-4 space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              name="name"
              defaultValue={ingredient.ingredientName}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              name="category"
              defaultValue={ingredient.ingredientCategory}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default Potency (0-5)</label>
            <Input
              name="defaultPotency"
              type="number"
              min="0"
              max="5"
              defaultValue={ingredient.defaultPotency}
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`rounded-lg border border-border p-3 flex items-center gap-4 hover:border-border/80 transition-colors cursor-pointer group ${success ? "border-herb-green/40 bg-herb-green/5" : ""}`}
      onClick={() => setEditing(true)}
    >
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="font-medium text-sm">{ingredient.ingredientName}</span>
        <Badge variant="secondary" className="text-xs">
          {ingredient.ingredientCategory}
        </Badge>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-xs text-muted-foreground mr-1.5">potency</span>
          <span className="font-mono text-sm font-semibold">
            {ingredient.defaultPotency}
          </span>
        </div>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Edit
        </span>
      </div>
    </div>
  );
}

function AddIngredientForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createIngredient({
        ingredientName: fd.get("name") as string,
        ingredientCategory: fd.get("category") as string,
        defaultPotency: parseInt(fd.get("defaultPotency") as string, 10),
      });
      onDone();
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Ingredient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="e.g. Garlic" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select
                name="category"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Default Potency (0-5)</label>
              <Input
                name="defaultPotency"
                type="number"
                min="0"
                max="5"
                defaultValue="3"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
