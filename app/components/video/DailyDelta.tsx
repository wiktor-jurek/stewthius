'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DayDelta } from '@/lib/actions';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyDeltaProps {
  deltas: DayDelta[];
  sentiment: string;
  ratingInferred: boolean;
}

function getSentimentBadge(sentiment: string) {
  const s = sentiment.toLowerCase();
  if (s.includes('super positive'))
    return { label: sentiment, className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (s.includes('positive'))
    return { label: sentiment, className: 'bg-herb-green/10 text-herb-green border-herb-green/30' };
  if (s.includes('super negative'))
    return { label: sentiment, className: 'bg-red-100 text-red-900 border-red-400' };
  if (s.includes('negative'))
    return { label: sentiment, className: 'bg-burnt-tomato/10 text-burnt-tomato border-burnt-tomato/30' };
  return { label: sentiment, className: 'bg-amber-100 text-amber-800 border-amber-300' };
}

export default function DailyDelta({ deltas, sentiment, ratingInferred }: DailyDeltaProps) {
  const overall = deltas.find((d) => d.metric === 'Overall');
  const badge = getSentimentBadge(sentiment);

  const sabotaged = overall && overall.delta !== null && overall.delta <= -2;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 The Daily Delta
        </CardTitle>
        <CardDescription>
          The stock ticker of soup — did today make the stew better or worse?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Badge variant="outline" className={badge.className}>
            {badge.label}
          </Badge>
          {ratingInferred && (
            <Badge variant="outline" className="bg-broth-amber/10 text-broth-amber border-broth-amber/30">
              🧠 AI Inferred
            </Badge>
          )}
          {sabotaged && (
            <Badge variant="outline" className="bg-red-100 text-red-900 border-red-400 animate-pulse">
              ⚠️ Sabotaged
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {deltas.map((d) => {
            const isPositive = d.delta !== null && d.delta > 0;
            const isNegative = d.delta !== null && d.delta < 0;
            const isNeutral = d.delta === null || d.delta === 0;

            return (
              <div
                key={d.metric}
                className="text-center p-4 rounded-xl bg-background/60 border border-border/30"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {d.metric}
                </div>
                <div className="text-2xl font-bold font-serif mb-1">
                  {d.current}/10
                </div>
                {d.delta !== null ? (
                  <div className={`flex items-center justify-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-herb-green' : isNegative ? 'text-burnt-tomato' : 'text-muted-foreground'
                  }`}>
                    {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                    {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
                    {isNeutral && <Minus className="h-3.5 w-3.5" />}
                    <span>
                      {isPositive && '+'}
                      {d.delta}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">First day</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
