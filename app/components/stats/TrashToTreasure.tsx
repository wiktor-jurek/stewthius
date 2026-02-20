'use client';

import { TrashToTreasureData } from '@/lib/actions';

interface TrashToTreasureProps {
  data: TrashToTreasureData;
}

const SentimentBar = ({ positive, neutral, negative }: {
  positive: number;
  neutral: number;
  negative: number;
}) => (
  <div className="space-y-1.5">
    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/50">
      <div style={{ width: `${positive}%` }} className="bg-herb-green transition-all" />
      <div style={{ width: `${neutral}%` }} className="bg-chart-4 transition-all" />
      <div style={{ width: `${negative}%` }} className="bg-burnt-tomato transition-all" />
    </div>
    <div className="flex justify-between text-[10px] text-muted-foreground">
      <span>{positive}% positive</span>
      <span>{negative}% negative</span>
    </div>
  </div>
);

const TrashToTreasure = ({ data }: TrashToTreasureProps) => {
  const { withTrash, withoutTrash } = data;

  if (withTrash.sampleSize === 0 && withoutTrash.sampleSize === 0) {
    return null;
  }

  const delta = withTrash.avgRating - withoutTrash.avgRating;
  const trashWins = delta > 0;

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          🗑️ The &ldquo;Trash to Treasure&rdquo; Ratio
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Does adding literal garbage make the stew better? We compared days when Zak threw in
          scraps and leftovers against days with proper ingredients to find out.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* VS badge */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gradient-primary text-primary-foreground w-12 h-12 rounded-full items-center justify-center font-serif font-bold text-sm shadow-warm-lg">
          vs
        </div>

        {/* Trash card */}
        <div className={`bg-card/80 backdrop-blur-sm border rounded-xl shadow-warm p-6 text-center transition-all ${trashWins ? 'border-herb-green/40 ring-1 ring-herb-green/20' : 'border-border/50'}`}>
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="font-serif font-semibold text-lg mb-1">With Scraps & Leftovers</h3>
          <p className="text-xs text-muted-foreground mb-4">{withTrash.sampleSize} days sampled</p>

          <div className="text-5xl font-serif font-bold text-foreground mb-1">
            {withTrash.avgRating}
            <span className="text-xl text-muted-foreground font-normal">/10</span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4 text-xs">
            <div>
              <div className="text-muted-foreground">Richness</div>
              <div className="font-semibold">{withTrash.avgRichness}/10</div>
            </div>
            <div>
              <div className="text-muted-foreground">Complexity</div>
              <div className="font-semibold">{withTrash.avgComplexity}/10</div>
            </div>
          </div>

          <SentimentBar
            positive={withTrash.positivePercent}
            neutral={withTrash.neutralPercent}
            negative={withTrash.negativePercent}
          />
          {trashWins && (
            <div className="mt-3 text-xs font-semibold text-herb-green">👑 Winner</div>
          )}
        </div>

        {/* Proper card */}
        <div className={`bg-card/80 backdrop-blur-sm border rounded-xl shadow-warm p-6 text-center transition-all ${!trashWins ? 'border-herb-green/40 ring-1 ring-herb-green/20' : 'border-border/50'}`}>
          <div className="text-4xl mb-3">👨‍🍳</div>
          <h3 className="font-serif font-semibold text-lg mb-1">Proper Ingredients Only</h3>
          <p className="text-xs text-muted-foreground mb-4">{withoutTrash.sampleSize} days sampled</p>

          <div className="text-5xl font-serif font-bold text-foreground mb-1">
            {withoutTrash.avgRating}
            <span className="text-xl text-muted-foreground font-normal">/10</span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4 text-xs">
            <div>
              <div className="text-muted-foreground">Richness</div>
              <div className="font-semibold">{withoutTrash.avgRichness}/10</div>
            </div>
            <div>
              <div className="text-muted-foreground">Complexity</div>
              <div className="font-semibold">{withoutTrash.avgComplexity}/10</div>
            </div>
          </div>

          <SentimentBar
            positive={withoutTrash.positivePercent}
            neutral={withoutTrash.neutralPercent}
            negative={withoutTrash.negativePercent}
          />
          {!trashWins && (
            <div className="mt-3 text-xs font-semibold text-herb-green">👑 Winner</div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground italic">
          {trashWins ? (
            <>
              The verdict: adding scraps and leftovers actually{' '}
              <span className="font-semibold text-herb-green not-italic">improves</span> the stew
              by {Math.abs(delta).toFixed(1)} points on average. The Leftover Paradox is real —
              Zak&apos;s garbage is everyone&apos;s treasure.
            </>
          ) : (
            <>
              The verdict: proper ingredients win by{' '}
              <span className="font-semibold text-herb-green not-italic">{Math.abs(delta).toFixed(1)}</span>{' '}
              points on average. Maybe there&apos;s a reason we don&apos;t usually cook
              with week-old pizza crusts.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default TrashToTreasure;
