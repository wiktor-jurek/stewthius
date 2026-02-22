'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StewRating } from '@/lib/actions';
import { getSentimentColor } from '@/lib/utils';

interface RatingCalendarProps {
  ratings: StewRating[];
  totalDays: number;
}

const CELL_SIZE = 10;
const CELL_GAP = 2;
const TOTAL_CELL = CELL_SIZE + CELL_GAP;

function ratingColor(rating: number): string {
  if (rating >= 9) return '#2D6A4F';
  if (rating >= 7) return '#4A7C59';
  if (rating >= 5) return '#C9943E';
  if (rating >= 3) return '#BC4749';
  return '#7B2D35';
}

function ratingOpacity(rating: number): number {
  return 0.6 + (rating / 10) * 0.4;
}

const RatingCalendar = ({ ratings, totalDays }: RatingCalendarProps) => {
  const router = useRouter();
  const [hovered, setHovered] = useState<StewRating | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const dayMap = useMemo(() => {
    const map = new Map<number, StewRating>();
    for (const r of ratings) map.set(r.day, r);
    return map;
  }, [ratings]);

  const maxDay = Math.max(totalDays, ...ratings.map(r => r.day));
  const rows = 7;
  const weeks = Math.ceil(maxDay / rows);
  const leftPad = 4;
  const topPad = 16;
  const svgWidth = leftPad + weeks * TOTAL_CELL + 4;
  const svgHeight = topPad + rows * TOTAL_CELL + 4;

  const cells = useMemo(() => {
    const result: { day: number; week: number; weekday: number; rating?: StewRating }[] = [];
    for (let d = 1; d <= maxDay; d++) {
      const offset = d - 1;
      const week = Math.floor(offset / rows);
      const weekday = offset % rows;
      result.push({ day: d, week, weekday, rating: dayMap.get(d) });
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

  if (ratings.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm overflow-x-auto relative"
    >
      <p className="text-xs text-center opacity-70 mb-2 tracking-wide uppercase">
        Every Day of the Stew
      </p>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {weekLabels.map(({ week, label }) => (
          <text
            key={week}
            x={leftPad + week * TOTAL_CELL + CELL_SIZE / 2}
            y={topPad - 5}
            textAnchor="middle"
            fontSize="8"
            fill="currentColor"
            opacity={0.5}
            fontFamily="var(--font-sans)"
          >
            {label}
          </text>
        ))}

        {cells.map(({ day, week, weekday, rating }) => {
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
              fill={rating ? ratingColor(rating.ratingOverall) : 'rgba(255,255,255,0.15)'}
              fillOpacity={rating ? ratingOpacity(rating.ratingOverall) : 1}
              stroke={hovered?.day === day ? '#fff' : 'transparent'}
              strokeWidth={1}
              className="transition-colors cursor-pointer"
              onClick={() => {
                if (rating) router.push(`/video/${day}`);
              }}
              onMouseEnter={(e) => {
                if (rating) {
                  setHovered(rating);
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
          className="absolute z-20 bg-card text-card-foreground border border-border rounded-lg shadow-warm-lg p-2.5 pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-serif font-bold text-xs">Day {hovered.day}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
            <div>
              Rating: <span className="font-medium text-foreground">{hovered.ratingOverall}/10</span>
            </div>
            <div>
              Mood:{' '}
              <span className="font-medium" style={{ color: getSentimentColor(hovered.creatorSentiment) }}>
                {hovered.creatorSentiment}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[10px] opacity-70">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#7B2D35' }} />
          <span>1-2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#BC4749' }} />
          <span>3-4</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#C9943E' }} />
          <span>5-6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#4A7C59' }} />
          <span>7-8</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#2D6A4F' }} />
          <span>9-10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-white/15" />
          <span>No data</span>
        </div>
      </div>
    </div>
  );
};

export default RatingCalendar;
