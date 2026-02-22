'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IngredientContribution } from '@/lib/actions';
import { getSentimentColor } from '@/lib/utils';

interface ContributionHeatmapProps {
  contributions: IngredientContribution[];
  ingredientName: string;
  totalDays: number;
}

const CELL_SIZE = 10;
const CELL_GAP = 2;
const TOTAL_CELL = CELL_SIZE + CELL_GAP;

function sentimentOpacity(sentiment: string): number {
  switch (sentiment) {
    case 'Super Positive': return 1;
    case 'Positive': return 0.8;
    case 'Neutral': return 0.5;
    case 'Negative': return 0.8;
    case 'Super Negative': return 1;
    default: return 0.5;
  }
}

const ContributionHeatmap = ({ contributions, ingredientName, totalDays }: ContributionHeatmapProps) => {
  const router = useRouter();
  const [hovered, setHovered] = useState<IngredientContribution | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const dayMap = useMemo(() => {
    const map = new Map<number, IngredientContribution>();
    for (const c of contributions) map.set(c.day, c);
    return map;
  }, [contributions]);

  const maxDay = Math.max(totalDays, ...contributions.map((c) => c.day));
  const rows = 7;
  const weeks = Math.ceil(maxDay / rows);
  const leftPad = 4;
  const topPad = 16;
  const svgWidth = leftPad + weeks * TOTAL_CELL + 4;
  const svgHeight = topPad + rows * TOTAL_CELL + 4;

  const cells = useMemo(() => {
    const result: { day: number; week: number; weekday: number; contribution?: IngredientContribution }[] = [];
    for (let d = 1; d <= maxDay; d++) {
      const offset = d - 1;
      const week = Math.floor(offset / rows);
      const weekday = offset % rows;
      result.push({ day: d, week, weekday, contribution: dayMap.get(d) });
    }
    return result;
  }, [maxDay, dayMap]);

  const weekLabels = useMemo(() => {
    const labels: { week: number; label: string }[] = [];
    const interval = Math.max(1, Math.floor(weeks / 6));
    for (let w = 0; w < weeks; w += interval) {
      const day = w * rows + 1;
      labels.push({ week: w, label: `${day}` });
    }
    return labels;
  }, [weeks]);

  if (contributions.length === 0) return null;

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-1">
          Stew Contributions
        </h2>
        <p className="text-sm text-foreground/60 max-w-xl">
          Every square is a stew day. Color marks when {ingredientName} was in the pot.
        </p>
      </div>

      <div
        ref={containerRef}
        className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm px-4 py-3 overflow-x-auto relative"
      >
        <svg width={svgWidth} height={svgHeight} className="block mx-auto">
          {/* Week/Day labels along top */}
          {weekLabels.map(({ week, label }) => (
            <text
              key={week}
              x={leftPad + week * TOTAL_CELL + CELL_SIZE / 2}
              y={topPad - 5}
              textAnchor="middle"
              fontSize="8"
              fill="var(--muted-foreground)"
              fontFamily="var(--font-sans)"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {cells.map(({ day, week, weekday, contribution }) => {
            const x = leftPad + week * TOTAL_CELL;
            const y = topPad + weekday * TOTAL_CELL;

            return (
              <rect
                key={day}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={contribution ? getSentimentColor(contribution.sentiment) : 'var(--foreground)'}
                fillOpacity={contribution ? sentimentOpacity(contribution.sentiment) : 0.06}
                stroke={hovered?.day === day ? 'var(--foreground)' : 'transparent'}
                strokeWidth={1}
                className="transition-colors cursor-pointer"
                onClick={() => router.push(`/video/${day}`)}
                onMouseEnter={(e) => {
                  if (contribution) {
                    setHovered(contribution);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setTooltipPos({
                        x: rect.left - containerRect.left + CELL_SIZE / 2,
                        y: rect.top - containerRect.top - 8,
                      });
                    }
                  }
                }}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {hovered && (
          <div
            className="absolute z-20 bg-card border border-border rounded-lg shadow-warm-lg p-2.5 pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="font-serif font-bold text-xs">Day {hovered.day}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
              <div>
                Rating: <span className="font-medium text-foreground">{hovered.ratingOverall}/10</span>
              </div>
              <div>
                Mood:{' '}
                <span className="font-medium" style={{ color: getSentimentColor(hovered.sentiment) }}>
                  {hovered.sentiment}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
        {['Super Positive', 'Positive', 'Neutral', 'Negative', 'Super Negative'].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: getSentimentColor(s), opacity: sentimentOpacity(s) }}
            />
            <span>{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-foreground/6" />
          <span>No addition</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
