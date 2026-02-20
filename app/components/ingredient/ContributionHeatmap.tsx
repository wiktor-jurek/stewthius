'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { IngredientContribution } from '@/lib/actions';
import { getSentimentColor } from '@/lib/utils';

interface ContributionHeatmapProps {
  contributions: IngredientContribution[];
  ingredientName: string;
}

const CELL_SIZE = 14;
const CELL_GAP = 3;
const TOTAL_CELL = CELL_SIZE + CELL_GAP;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const ContributionHeatmap = ({ contributions, ingredientName }: ContributionHeatmapProps) => {
  const [hovered, setHovered] = useState<IngredientContribution | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const dayMap = useMemo(() => {
    const map = new Map<number, IngredientContribution>();
    for (const c of contributions) map.set(c.day, c);
    return map;
  }, [contributions]);

  const { minDay, maxDay } = useMemo(() => {
    if (contributions.length === 0) return { minDay: 1, maxDay: 100 };
    const days = contributions.map((c) => c.day);
    return { minDay: Math.min(...days), maxDay: Math.max(...days) };
  }, [contributions]);

  const totalDays = maxDay - minDay + 1;
  const weeks = Math.ceil(totalDays / 7);
  const leftPad = 32;
  const topPad = 20;
  const svgWidth = leftPad + weeks * TOTAL_CELL + 4;
  const svgHeight = topPad + 7 * TOTAL_CELL + 4;

  const cells = useMemo(() => {
    const result: { day: number; week: number; weekday: number; contribution?: IngredientContribution }[] = [];
    for (let d = minDay; d <= maxDay; d++) {
      const offset = d - minDay;
      const week = Math.floor(offset / 7);
      const weekday = offset % 7;
      result.push({ day: d, week, weekday, contribution: dayMap.get(d) });
    }
    return result;
  }, [minDay, maxDay, dayMap]);

  const weekLabels = useMemo(() => {
    const labels: { week: number; label: string }[] = [];
    const interval = Math.max(1, Math.floor(weeks / 8));
    for (let w = 0; w < weeks; w += interval) {
      const day = minDay + w * 7;
      labels.push({ week: w, label: `Day ${day}` });
    }
    return labels;
  }, [weeks, minDay]);

  if (contributions.length === 0) return null;

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          📅 Stew Contributions
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Every square is a stew day. Colored squares show when {ingredientName} was in the pot,
          tinted by Zak&apos;s mood.
        </p>
      </div>

      <div
        ref={containerRef}
        className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-5 overflow-x-auto relative"
      >
        <svg width={svgWidth} height={svgHeight} className="block mx-auto">
          {/* Day-of-week labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={i}
                x={leftPad - 6}
                y={topPad + i * TOTAL_CELL + CELL_SIZE * 0.75}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted-foreground)"
                fontFamily="var(--font-sans)"
              >
                {label}
              </text>
            ) : null,
          )}

          {/* Week labels */}
          {weekLabels.map(({ week, label }) => (
            <text
              key={week}
              x={leftPad + week * TOTAL_CELL + CELL_SIZE / 2}
              y={topPad - 6}
              textAnchor="middle"
              fontSize="9"
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
                rx={3}
                fill={contribution ? getSentimentColor(contribution.sentiment) : 'var(--muted)'}
                fillOpacity={contribution ? sentimentOpacity(contribution.sentiment) : 0.3}
                stroke={hovered?.day === day ? 'var(--foreground)' : 'transparent'}
                strokeWidth={1.5}
                className="transition-colors cursor-pointer"
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

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        {['Super Positive', 'Positive', 'Neutral', 'Negative', 'Super Negative'].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: getSentimentColor(s), opacity: sentimentOpacity(s) }}
            />
            <span>{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-muted opacity-30" />
          <span>No addition</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
