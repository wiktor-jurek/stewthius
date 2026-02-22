import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllIngredients } from "@/lib/admin-actions";
import { IngredientsManager } from "./ingredients-manager";

export default async function IngredientsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/admin/login");
  if (session.user.role !== "admin") return null;

  const ingredients = await getAllIngredients();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Ingredients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ingredients.length} ingredients total
          </p>
        </div>
      </div>
      <IngredientsManager ingredients={ingredients} />
    </div>
  );
}
