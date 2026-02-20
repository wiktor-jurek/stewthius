'use client';

import Link from 'next/link';
import { IngredientImpactData } from '@/lib/actions';

interface SaviorSaboteurProps {
  data: IngredientImpactData;
  ingredientName: string;
}

const SaviorSaboteur = ({ data, ingredientName }: SaviorSaboteurProps) => {
  const { netImpact, totalAdditions, saviorDays, saboteurDays, bestDays, worstDays } = data;

  if (totalAdditions === 0) return null;

  const isSavior = netImpact > 0;
  const isNeutral = netImpact === 0;

  const verdict = isNeutral
    ? 'Filler'
    : isSavior
      ? 'Savior'
      : 'Saboteur';

  const verdictColor = isNeutral
    ? 'text-chart-4'
    : isSavior
      ? 'text-herb-green'
      : 'text-burnt-tomato';

  const verdictBg = isNeutral
    ? 'bg-chart-4/10 border-chart-4/30'
    : isSavior
      ? 'bg-herb-green/10 border-herb-green/30'
      : 'bg-burnt-tomato/10 border-burnt-tomato/30';

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          {isSavior ? '🛡️' : isNeutral ? '➖' : '💣'} Savior or Saboteur?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Does {ingredientName} help or hurt the stew? We compared each addition
          to the previous day&apos;s rating.
        </p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-6">
        {/* Main verdict */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${verdictBg}`}>
            <span className={`text-lg font-serif font-bold ${verdictColor}`}>{verdict}</span>
          </div>
          <div className="mt-3">
            <span className={`text-5xl font-serif font-bold ${verdictColor}`}>
              {netImpact > 0 ? '+' : ''}{netImpact}
            </span>
            <span className="text-lg text-muted-foreground ml-1">avg. impact</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="bg-card/60 rounded-lg p-3">
            <div className="text-2xl font-serif font-bold text-foreground">{totalAdditions}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Additions</div>
          </div>
          <div className="bg-herb-green/5 rounded-lg p-3">
            <div className="text-2xl font-serif font-bold text-herb-green">{saviorDays}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Savior Days</div>
          </div>
          <div className="bg-burnt-tomato/5 rounded-lg p-3">
            <div className="text-2xl font-serif font-bold text-burnt-tomato">{saboteurDays}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Saboteur Days</div>
          </div>
        </div>

        {/* Win/Loss bar */}
        {totalAdditions > 0 && (
          <div className="mb-6">
            <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
              <div
                style={{ width: `${(saviorDays / totalAdditions) * 100}%` }}
                className="bg-herb-green transition-all"
              />
              <div
                style={{ width: `${((totalAdditions - saviorDays - saboteurDays) / totalAdditions) * 100}%` }}
                className="bg-chart-4/50 transition-all"
              />
              <div
                style={{ width: `${(saboteurDays / totalAdditions) * 100}%` }}
                className="bg-burnt-tomato transition-all"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>↑ Improved</span>
              <span>↓ Declined</span>
            </div>
          </div>
        )}

        {/* Best & worst days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestDays.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-herb-green uppercase tracking-wider mb-2">
                Best Days
              </h3>
              <div className="space-y-2">
                {bestDays.map((d) => (
                  <DayCard
                    key={d.day}
                    day={d.day}
                    delta={d.delta}
                    keyQuote={d.keyQuote}
                    tiktokUrl={d.tiktokUrl}
                    positive
                  />
                ))}
              </div>
            </div>
          )}
          {worstDays.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-burnt-tomato uppercase tracking-wider mb-2">
                Worst Days
              </h3>
              <div className="space-y-2">
                {worstDays.map((d) => (
                  <DayCard
                    key={d.day}
                    day={d.day}
                    delta={d.delta}
                    keyQuote={d.keyQuote}
                    tiktokUrl={d.tiktokUrl}
                    positive={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function DayCard({
  day,
  delta,
  keyQuote,
  positive,
}: {
  day: number;
  delta: number;
  keyQuote?: string;
  tiktokUrl?: string;
  positive: boolean;
}) {
  return (
    <Link
      href={`/video/${day}`}
      className="block bg-card/60 border border-border/30 rounded-lg p-3 hover:border-broth-amber/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">Day {day}</span>
        <span className={`text-sm font-serif font-bold ${positive ? 'text-herb-green' : 'text-burnt-tomato'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
        </span>
      </div>
      {keyQuote && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">&ldquo;{keyQuote}&rdquo;</p>
      )}
      <span className="text-[10px] text-primary mt-1 inline-block">
        View Day {day} →
      </span>
    </Link>
  );
}

export default SaviorSaboteur;
