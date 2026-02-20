'use client';

import Link from 'next/link';
import { PairedIngredient } from '@/lib/actions';
import { getIngredientIcon } from '@/lib/utils';

interface PairedWithProps {
  pairings: PairedIngredient[];
  ingredientName: string;
}

const PairedWith = ({ pairings, ingredientName }: PairedWithProps) => {
  if (pairings.length === 0) return null;

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-1">
          🤝 Usually Paired With
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          When {ingredientName} goes in, these follow.
        </p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-6">
        <div className="space-y-2">
          {pairings.map((p) => {
            const slug = p.name.toLowerCase().replace(/\s+/g, '-');
            const icon = getIngredientIcon(p.name);

            return (
              <Link
                key={p.name}
                href={`/ingredient/${encodeURIComponent(slug)}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <span className="text-xl w-8 text-center shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{p.category}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-serif font-bold text-foreground">{p.percentage}%</div>
                  <div className="text-[10px] text-muted-foreground">{p.sharedDays} days</div>
                </div>
                <div className="w-20 h-1.5 bg-muted/50 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{ width: `${p.percentage}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PairedWith;
