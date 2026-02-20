'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PercentileComparison } from '@/lib/actions';
import { Eye, Star } from 'lucide-react';

interface ViralVsTastyBarProps {
  data: PercentileComparison;
  day: number;
}

function getLabel(viewPct: number, ratingPct: number): { text: string; color: string } {
  if (viewPct >= 70 && ratingPct <= 40) return { text: 'TikTok Hit, Culinary Miss', color: 'text-burnt-tomato' };
  if (viewPct <= 40 && ratingPct >= 70) return { text: 'Hidden Gem', color: 'text-herb-green' };
  if (viewPct >= 70 && ratingPct >= 70) return { text: 'The Full Package', color: 'text-broth-amber' };
  if (viewPct <= 30 && ratingPct <= 30) return { text: 'Flew Under the Radar', color: 'text-muted-foreground' };
  return { text: 'Middle of the Pack', color: 'text-muted-foreground' };
}

function formatCount(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}

export default function ViralVsTastyBar({ data, day }: ViralVsTastyBarProps) {
  if (data.viewCount === 0 && data.ratingOverall === 0) return null;

  const label = getLabel(data.viewPercentile, data.ratingPercentile);

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Viral vs. Tasty
        </CardTitle>
        <CardDescription>
          How does Day {day} rank — for TikTok <em>and</em> for the stew?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`text-center text-lg font-serif font-semibold ${label.color}`}>
          {label.text}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> Views ({formatCount(data.viewCount)})
              </span>
              <span className="font-medium">Top {100 - data.viewPercentile}%</span>
            </div>
            <div className="h-4 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-broth-amber/60 to-broth-amber transition-all duration-700"
                style={{ width: `${data.viewPercentile}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-3.5 w-3.5" /> Taste ({data.ratingOverall}/10)
              </span>
              <span className="font-medium">Top {100 - data.ratingPercentile}%</span>
            </div>
            <div className="h-4 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-herb-green/60 to-herb-green transition-all duration-700"
                style={{ width: `${data.ratingPercentile}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
