'use client';

import Link from 'next/link';
import { IngredientImpactRankings as Rankings } from '@/lib/actions';
import { getIngredientIcon } from '@/lib/utils';

interface IngredientImpactRankingsProps {
  rankings: Rankings;
}

const IngredientImpactRankings = ({ rankings }: IngredientImpactRankingsProps) => {
  const { top, bottom } = rankings;
  if (top.length === 0 && bottom.length === 0) return null;

  const maxAbsDelta = Math.max(
    ...top.map((r) => Math.abs(r.avgDelta)),
    ...bottom.map((r) => Math.abs(r.avgDelta)),
    0.1,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Top 5 */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-herb-green mb-1 flex items-center gap-1.5">
          <span>🚀</span> Top 5 Saviors
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          Ingredients that improved the stew the most the next day
        </p>
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Not enough data yet</p>
        ) : (
          <div className="space-y-2.5">
            {top.map((item, i) => (
              <RankRow
                key={item.name}
                rank={i + 1}
                name={item.name}
                delta={item.avgDelta}
                timesAdded={item.timesAdded}
                maxDelta={maxAbsDelta}
                positive
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom 5 */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-burnt-tomato mb-1 flex items-center gap-1.5">
          <span>💀</span> Bottom 5 Saboteurs
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          Ingredients followed by the steepest next-day decline
        </p>
        {bottom.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Not enough data yet</p>
        ) : (
          <div className="space-y-2.5">
            {bottom.map((item, i) => (
              <RankRow
                key={item.name}
                rank={i + 1}
                name={item.name}
                delta={item.avgDelta}
                timesAdded={item.timesAdded}
                maxDelta={maxAbsDelta}
                positive={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function RankRow({
  rank,
  name,
  delta,
  timesAdded,
  maxDelta,
  positive,
}: {
  rank: number;
  name: string;
  delta: number;
  timesAdded: number;
  maxDelta: number;
  positive: boolean;
}) {
  const barWidth = Math.max((Math.abs(delta) / maxDelta) * 100, 8);
  const slug = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
  const icon = getIngredientIcon(name);

  return (
    <Link
      href={`/ingredient/${slug}`}
      className="group flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/40 transition-colors"
    >
      <span className="text-xs font-mono text-muted-foreground w-4 text-right shrink-0">
        {rank}
      </span>
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {name}
          </span>
          <span
            className={`text-sm font-serif font-bold shrink-0 ${
              positive ? 'text-herb-green' : 'text-burnt-tomato'
            }`}
          >
            {delta > 0 ? '+' : ''}{delta.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                positive ? 'bg-herb-green/70' : 'bg-burnt-tomato/70'
              }`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {timesAdded}×
          </span>
        </div>
      </div>
    </Link>
  );
}

export default IngredientImpactRankings;
