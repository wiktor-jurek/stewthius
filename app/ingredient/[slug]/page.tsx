import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getIngredientBySlug,
  getIngredientContributions,
  getIngredientImpact,
  getIngredientFlavorFootprint,
  getIngredientPrepStyles,
  getIngredientPairings,
} from '@/lib/actions';
import { getIngredientIcon } from '@/lib/utils';
import ContributionHeatmap from '@/app/components/ingredient/ContributionHeatmap';
import SaviorSaboteur from '@/app/components/ingredient/SaviorSaboteur';
import FlavorFootprint from '@/app/components/ingredient/FlavorFootprint';
import PrepStyleBreakdown from '@/app/components/ingredient/PrepStyleBreakdown';
import PairedWith from '@/app/components/ingredient/PairedWith';

interface IngredientPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: IngredientPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ingredient = await getIngredientBySlug(slug);
  if (!ingredient) return { title: 'Ingredient Not Found — Stewthius' };

  return {
    title: `${ingredient.name} — Stewthius`,
    description: `How does ${ingredient.name} affect the perpetual stew? Contribution history, flavor impact, prep styles, and more.`,
  };
}

export default async function IngredientPage({ params }: IngredientPageProps) {
  const { slug } = await params;
  const ingredient = await getIngredientBySlug(slug);

  if (!ingredient) notFound();

  const [contributions, impact, flavorFootprint, prepStyles, pairings] = await Promise.all([
    getIngredientContributions(ingredient.ingredientId),
    getIngredientImpact(ingredient.ingredientId),
    getIngredientFlavorFootprint(ingredient.ingredientId),
    getIngredientPrepStyles(ingredient.ingredientId),
    getIngredientPairings(ingredient.ingredientId),
  ]);

  const icon = getIngredientIcon(ingredient.name);

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-primary text-primary-foreground p-8 rounded-xl shadow-warm-lg">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm opacity-80 hover:opacity-100 transition-opacity mb-4"
            >
              ← Back to the Kitchen
            </Link>
            <div className="text-5xl mb-3">{icon}</div>
            <h1 className="text-4xl font-bold font-serif mb-2">{ingredient.name}</h1>
            <p className="text-sm opacity-80 tracking-wide uppercase">
              {ingredient.category}
            </p>
            <p className="text-base opacity-90 max-w-md mx-auto mt-3">
              Added {contributions.length} time{contributions.length !== 1 ? 's' : ''} to the pot.
              Here&apos;s what it did.
            </p>
          </div>
        </div>

        <section>
          <SaviorSaboteur data={impact} ingredientName={ingredient.name} />
        </section>

        <section>
          <ContributionHeatmap contributions={contributions} ingredientName={ingredient.name} />
        </section>

        <section>
          <FlavorFootprint data={flavorFootprint} ingredientName={ingredient.name} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <PrepStyleBreakdown data={prepStyles} ingredientName={ingredient.name} />
          </section>
          <section>
            <PairedWith pairings={pairings} ingredientName={ingredient.name} />
          </section>
        </div>

        <footer className="text-center pb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to the Kitchen
          </Link>
        </footer>
      </div>
    </div>
  );
}
