'use client';

import { useState, useMemo } from 'react';
import { ViralVsTastyCategory } from '@/lib/actions';

interface ViralVsTastyProps {
  data: ViralVsTastyCategory[];
}

const W = 800;
const H = 550;
const M = { top: 40, right: 30, bottom: 55, left: 60 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const QUADRANTS = {
  topLeft: { text: 'Hidden Gems', emoji: '💎' },
  topRight: { text: 'The Holy Grail', emoji: '🏆' },
  bottomLeft: { text: 'Forgettable', emoji: '💤' },
  bottomRight: { text: 'Engagement Trap', emoji: '📱' },
};

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

function shortenCategory(cat: string): string {
  return cat
    .replace('Protein-', '')
    .replace('Liquid-', '')
    .replace('Starch-', '')
    .replace('Nut/Seed', 'Nuts')
    .replace('Sauce/Paste', 'Sauce')
    .replace('Pickle/Fermented', 'Pickled')
    .replace('Bread/Baked', 'Bread')
    .replace('Snack/Processed', 'Snack')
    .replace('Aromatic Veg', 'Aromatic')
    .replace('Leafy Green', 'Leafy')
    .replace('Cruciferous Veg', 'Cruciferous');
}

const ViralVsTasty = ({ data }: ViralVsTastyProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { logMin, logMax, ratingMin, ratingMax, medianLogViews, medianRating, logTicks } =
    useMemo(() => {
      if (data.length === 0) {
        return {
          logMin: 0, logMax: 1, ratingMin: 0, ratingMax: 10,
          medianLogViews: 0.5, medianRating: 5, logTicks: [],
        };
      }
      const logViews = data.map((d) => Math.log10(Math.max(d.avgViews, 1)));
      const ratings = data.map((d) => d.avgRating);
      const sortedLog = [...logViews].sort((a, b) => a - b);
      const sortedRating = [...ratings].sort((a, b) => a - b);

      const lMin = Math.floor(Math.min(...logViews)) - 0.2;
      const lMax = Math.ceil(Math.max(...logViews)) + 0.2;

      const ticks: number[] = [];
      for (let l = Math.ceil(lMin); l <= Math.floor(lMax); l++) {
        ticks.push(l);
      }

      return {
        logMin: lMin,
        logMax: lMax,
        ratingMin: Math.max(0, Math.floor(Math.min(...ratings)) - 0.5),
        ratingMax: Math.min(10, Math.ceil(Math.max(...ratings)) + 0.5),
        medianLogViews: sortedLog[Math.floor(sortedLog.length / 2)],
        medianRating: sortedRating[Math.floor(sortedRating.length / 2)],
        logTicks: ticks,
      };
    }, [data]);

  const xScale = (logV: number) => M.left + ((logV - logMin) / (logMax - logMin)) * PW;
  const yScale = (rating: number) =>
    M.top + (1 - (rating - ratingMin) / (ratingMax - ratingMin)) * PH;

  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;

  if (data.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          📱 Viral Ingredients vs. Tasty Ingredients
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Does TikTok&apos;s algorithm prefer bad soup? Each bubble is an ingredient
          category — positioned by average views and taste rating. Bigger bubbles mean more data.
        </p>
      </div>

      <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Quadrant backgrounds */}
          <rect
            x={M.left} y={M.top}
            width={xScale(medianLogViews) - M.left}
            height={yScale(medianRating) - M.top}
            fill="var(--chart-4)" opacity="0.04"
          />
          <rect
            x={xScale(medianLogViews)} y={M.top}
            width={M.left + PW - xScale(medianLogViews)}
            height={yScale(medianRating) - M.top}
            fill="var(--chart-2)" opacity="0.05"
          />
          <rect
            x={M.left} y={yScale(medianRating)}
            width={xScale(medianLogViews) - M.left}
            height={M.top + PH - yScale(medianRating)}
            fill="var(--muted-foreground)" opacity="0.03"
          />
          <rect
            x={xScale(medianLogViews)} y={yScale(medianRating)}
            width={M.left + PW - xScale(medianLogViews)}
            height={M.top + PH - yScale(medianRating)}
            fill="var(--destructive)" opacity="0.05"
          />

          {/* Median dividers */}
          <line
            x1={xScale(medianLogViews)} y1={M.top}
            x2={xScale(medianLogViews)} y2={M.top + PH}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="6,4"
          />
          <line
            x1={M.left} y1={yScale(medianRating)}
            x2={M.left + PW} y2={yScale(medianRating)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="6,4"
          />

          {/* Quadrant labels */}
          <text x={M.left + 10} y={M.top + 20} fontSize="11" fill="var(--chart-4)" opacity="0.7" fontWeight="500">
            {QUADRANTS.topLeft.emoji} {QUADRANTS.topLeft.text}
          </text>
          <text x={M.left + PW - 10} y={M.top + 20} fontSize="11" fill="var(--chart-2)" opacity="0.8" fontWeight="500" textAnchor="end">
            {QUADRANTS.topRight.emoji} {QUADRANTS.topRight.text}
          </text>
          <text x={M.left + 10} y={M.top + PH - 8} fontSize="11" fill="var(--muted-foreground)" opacity="0.5" fontWeight="500">
            {QUADRANTS.bottomLeft.emoji} {QUADRANTS.bottomLeft.text}
          </text>
          <text x={M.left + PW - 10} y={M.top + PH - 8} fontSize="11" fill="var(--destructive)" opacity="0.7" fontWeight="500" textAnchor="end">
            {QUADRANTS.bottomRight.emoji} {QUADRANTS.bottomRight.text}
          </text>

          {/* Axis labels */}
          <text
            x={M.left + PW / 2} y={H - 8}
            textAnchor="middle" fontSize="12" fill="var(--muted-foreground)" fontWeight="500"
          >
            Average Views (log scale)
          </text>
          <text
            x={14} y={M.top + PH / 2}
            textAnchor="middle" fontSize="12" fill="var(--muted-foreground)" fontWeight="500"
            transform={`rotate(-90 14 ${M.top + PH / 2})`}
          >
            Average Taste Rating
          </text>

          {/* X axis ticks */}
          {logTicks.map((logV) => (
            <g key={`xt-${logV}`}>
              <line
                x1={xScale(logV)} y1={M.top + PH}
                x2={xScale(logV)} y2={M.top + PH + 5}
                stroke="var(--muted-foreground)" strokeWidth="1"
              />
              <text
                x={xScale(logV)} y={M.top + PH + 18}
                textAnchor="middle" fontSize="10" fill="var(--muted-foreground)"
              >
                {formatViews(Math.pow(10, logV))}
              </text>
            </g>
          ))}

          {/* Y axis ticks */}
          {Array.from(
            { length: Math.ceil(ratingMax) - Math.floor(ratingMin) + 1 },
            (_, i) => Math.floor(ratingMin) + i,
          ).map((v) => (
            <g key={`yt-${v}`}>
              <line
                x1={M.left - 5} y1={yScale(v)}
                x2={M.left} y2={yScale(v)}
                stroke="var(--muted-foreground)" strokeWidth="1"
              />
              <text
                x={M.left - 10} y={yScale(v) + 4}
                textAnchor="end" fontSize="10" fill="var(--muted-foreground)"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Data dots + labels */}
          {data.map((d, i) => {
            const logV = Math.log10(Math.max(d.avgViews, 1));
            const cx = xScale(logV);
            const cy = yScale(d.avgRating);
            const r = Math.max(8, Math.min(22, Math.sqrt(d.sampleSize) * 3));
            const isHovered = hoveredIdx === i;

            return (
              <g key={d.category}>
                <circle
                  cx={cx} cy={cy}
                  r={isHovered ? r + 3 : r}
                  fill="var(--primary)"
                  fillOpacity={isHovered ? 0.85 : 0.55}
                  stroke={isHovered ? 'var(--foreground)' : 'var(--primary)'}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  strokeOpacity={isHovered ? 0.8 : 0.3}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease, fill-opacity 0.15s ease' }}
                />
                <text
                  x={cx} y={cy - r - 5}
                  textAnchor="middle" fontSize="9" fill="var(--foreground)"
                  fontWeight="500" pointerEvents="none"
                  opacity={isHovered ? 1 : 0.65}
                >
                  {shortenCategory(d.category)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hovered && (
        <div
          className="absolute z-20 bg-card border border-border rounded-xl shadow-warm-lg p-3 pointer-events-none max-w-[220px]"
          style={{
            left: Math.min(Math.max(mousePos.x - 110, 8), 700),
            top: mousePos.y + 20,
          }}
        >
          <div className="font-serif font-bold text-sm mb-1">{hovered.category}</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>
              Avg Views:{' '}
              <span className="font-medium text-foreground">
                {formatViews(hovered.avgViews)}
              </span>
            </div>
            <div>
              Avg Rating:{' '}
              <span className="font-medium text-foreground">{hovered.avgRating}/10</span>
            </div>
            <div>
              Sample Size:{' '}
              <span className="font-medium text-foreground">
                {hovered.sampleSize} additions
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground italic">
          Where Zak the Chef and Zak the TikToker are at war. Categories in the top-left
          are <span className="font-semibold not-italic">Hidden Gems</span> — great taste,
          low views. Categories in the bottom-right are the{' '}
          <span className="font-semibold text-destructive not-italic">Engagement Trap</span>{' '}
          — TikTok literally rewards him for making worse soup.
        </p>
      </div>
    </div>
  );
};

export default ViralVsTasty;
