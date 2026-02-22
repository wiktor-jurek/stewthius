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
  getCurrentStats,
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
  if (!ingredient) return { title: 'Ingredient Not Found - Stewthius' };

  return {
    title: `${ingredient.name} - Stewthius`,
    description: `How does ${ingredient.name} affect the perpetual stew? Contribution history, flavor impact, prep styles, and more.`,
  };
}

export default async function IngredientPage({ params }: IngredientPageProps) {
  const { slug } = await params;
  const ingredient = await getIngredientBySlug(slug);

  if (!ingredient) notFound();

  const [contributions, impact, flavorFootprint, prepStyles, pairings, stats] = await Promise.all([
    getIngredientContributions(ingredient.ingredientId),
    getIngredientImpact(ingredient.ingredientId),
    getIngredientFlavorFootprint(ingredient.ingredientId),
    getIngredientPrepStyles(ingredient.ingredientId),
    getIngredientPairings(ingredient.ingredientId),
    getCurrentStats(),
  ]);

  const icon = getIngredientIcon(ingredient.name);
  const isLowData = contributions.length <= 2;

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
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

        {/* Middle Row: Contribution Heatmap + Flavor Footprint side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <ContributionHeatmap
              contributions={contributions}
              ingredientName={ingredient.name}
              totalDays={stats.currentDay}
            />
          </section>
          <section>
            <FlavorFootprint data={flavorFootprint} ingredientName={ingredient.name} />
          </section>
        </div>

        {/* Bottom Row: Prep Style + Pairings */}
        {isLowData ? (
          <section>
            <div className="text-center mb-5">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-1">
                📊 Ingredient Stats
              </h2>
              <p className="text-sm text-foreground/60 max-w-md mx-auto">
                Prep style and pairings from {contributions.length} addition{contributions.length !== 1 ? 's' : ''}.
              </p>
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {prepStyles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                      Prep Style
                    </h3>
                    <div className="space-y-2">
                      {prepStyles.map((d) => (
                        <div key={d.style} className="flex items-center gap-2">
                          <span className="text-sm">{d.style}</span>
                          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${d.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-foreground/60 w-10 text-right">{d.count}× ({d.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pairings.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                      Usually Paired With
                    </h3>
                    <div className="space-y-2">
                      {pairings.map((p) => {
                        const slug = p.name.toLowerCase().replace(/\s+/g, '-');
                        const pIcon = getIngredientIcon(p.name);
                        return (
                          <Link
                            key={p.name}
                            href={`/ingredient/${encodeURIComponent(slug)}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <span className="text-sm">{pIcon}</span>
                            <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                            <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary/60 transition-all"
                                style={{ width: `${p.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-foreground/60">{p.percentage}%</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <PrepStyleBreakdown data={prepStyles} ingredientName={ingredient.name} />
            </section>
            <section>
              <PairedWith pairings={pairings} ingredientName={ingredient.name} />
            </section>
          </div>
        )}

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
