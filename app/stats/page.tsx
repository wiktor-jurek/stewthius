import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getStewRatings,
  getTrashToTreasureData,
  getViralVsTastyData,
  getClarityRichnessData,
} from '@/lib/actions';
import TrashToTreasure from '@/app/components/stats/TrashToTreasure';
import ComplexityTippingPoint from '@/app/components/stats/ComplexityTippingPoint';
import ViralVsTasty from '@/app/components/stats/ViralVsTasty';
import ClarityRichnessMatrix from '@/app/components/stats/ClarityRichnessMatrix';

export const metadata: Metadata = {
  title: 'The Stew Lab — Stewthius',
  description:
    'Deep cuts from the broth. Does garbage make better soup? Does TikTok prefer bad stew? The data has answers.',
};

export default async function StatsPage() {
  const [ratings, trashData, viralData, clarityData] = await Promise.all([
    getStewRatings(),
    getTrashToTreasureData(),
    getViralVsTastyData(),
    getClarityRichnessData(),
  ]);

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
            <h1 className="text-4xl font-bold font-serif mb-3">The Stew Lab</h1>
            <p className="text-lg opacity-90 max-w-lg mx-auto">
              Deep cuts from the broth. Where data science meets culinary chaos.
            </p>
          </div>
        </div>

        <section>
          <TrashToTreasure data={trashData} />
        </section>

        <section>
          <ComplexityTippingPoint ratings={ratings} />
        </section>

        <section>
          <ViralVsTasty data={viralData} />
        </section>

        <section>
          <ClarityRichnessMatrix data={clarityData} />
        </section>

        {/* Stew Singularity teaser */}
        <section className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            🧠 The Stew Singularity
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
            Using AI embeddings, we gave every video a &ldquo;vibe check&rdquo; and mapped the
            entire history of the stew into distinct eras — The Hearty Winter Broth era, The
            Too Much Acid dark ages, and beyond.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Explore the Topography of Taste →
          </Link>
        </section>

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
