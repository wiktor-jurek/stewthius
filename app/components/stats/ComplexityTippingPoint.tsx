'use client';

import { useState, useMemo } from 'react';
import { StewRating } from '@/lib/actions';
import { getSentimentColor } from '@/lib/utils';

interface ComplexityTippingPointProps {
  ratings: StewRating[];
}

const W = 800;
const H = 500;
const M = { top: 30, right: 30, bottom: 55, left: 55 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
const MAX_VAL = 10;

const SENTIMENT_LEGEND = [
  { label: 'Super Positive', color: '#2D6A4F' },
  { label: 'Positive', color: '#4A7C59' },
  { label: 'Neutral', color: '#C9943E' },
  { label: 'Negative', color: '#BC4749' },
  { label: 'Super Negative', color: '#7B2D35' },
];

function xScale(v: number) {
  return M.left + (v / MAX_VAL) * PW;
}

function yScale(v: number) {
  return M.top + (1 - v / MAX_VAL) * PH;
}

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

const ComplexityTippingPoint = ({ ratings }: ComplexityTippingPointProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const trendData = useMemo(() => {
    const bins: { sum: number; count: number }[] = Array.from(
      { length: 10 },
      () => ({ sum: 0, count: 0 }),
    );
    for (const r of ratings) {
      const binIdx = Math.min(Math.floor(r.ratingComplexity), 9);
      bins[binIdx].sum += r.ratingOverall;
      bins[binIdx].count += 1;
    }
    const points = bins
      .map((b, i) =>
        b.count >= 2 ? { complexity: i + 0.5, rating: b.sum / b.count } : null,
      )
      .filter(Boolean) as { complexity: number; rating: number }[];

    const peak =
      points.length > 0
        ? points.reduce((best, p) => (p.rating > best.rating ? p : best), points[0])
        : null;

    return { points, peak };
  }, [ratings]);

  const trendPath = buildSmoothPath(
    trendData.points.map((p) => ({ x: xScale(p.complexity), y: yScale(p.rating) })),
  );

  const hovered = hoveredIdx !== null ? ratings[hoveredIdx] : null;

  if (ratings.length === 0) return null;

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
          📈 The Complexity Tipping Point
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          At what point do too many flavors make the stew taste like absolutely nothing?
          Every chef knows that mixing every color of paint gives you brown — does the
          same apply to soup?
        </p>
      </div>

      <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <g key={`grid-${v}`}>
              <line
                x1={xScale(v)} y1={M.top}
                x2={xScale(v)} y2={M.top + PH}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5"
              />
              <line
                x1={M.left} y1={yScale(v)}
                x2={M.left + PW} y2={yScale(v)}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5"
              />
              <text
                x={xScale(v)} y={M.top + PH + 16}
                textAnchor="middle" fontSize="11" fill="var(--muted-foreground)"
              >
                {v}
              </text>
              <text
                x={M.left - 10} y={yScale(v) + 4}
                textAnchor="end" fontSize="11" fill="var(--muted-foreground)"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={M.left + PW / 2} y={H - 8}
            textAnchor="middle" fontSize="12" fill="var(--muted-foreground)" fontWeight="500"
          >
            Complexity Rating
          </text>
          <text
            x={14} y={M.top + PH / 2}
            textAnchor="middle" fontSize="12" fill="var(--muted-foreground)" fontWeight="500"
            transform={`rotate(-90 14 ${M.top + PH / 2})`}
          >
            Overall Rating
          </text>

          {/* Trend line */}
          {trendPath && (
            <path
              d={trendPath}
              fill="none" stroke="var(--primary)" strokeWidth="2.5"
              strokeLinecap="round" opacity="0.6"
            />
          )}

          {/* Peak marker */}
          {trendData.peak && (
            <g>
              <line
                x1={xScale(trendData.peak.complexity)}
                y1={yScale(trendData.peak.rating) - 18}
                x2={xScale(trendData.peak.complexity)}
                y2={yScale(trendData.peak.rating) - 6}
                stroke="var(--primary)" strokeWidth="1.5"
              />
              <text
                x={xScale(trendData.peak.complexity)}
                y={yScale(trendData.peak.rating) - 22}
                textAnchor="middle" fontSize="10" fill="var(--primary)" fontWeight="600"
              >
                Peak: {trendData.peak.rating.toFixed(1)}
              </text>
            </g>
          )}

          {/* Data dots */}
          {ratings.map((r, i) => (
            <circle
              key={i}
              cx={xScale(r.ratingComplexity)}
              cy={yScale(r.ratingOverall)}
              r={hoveredIdx === i ? 6 : 4}
              fill={getSentimentColor(r.creatorSentiment)}
              fillOpacity={0.7}
              stroke={hoveredIdx === i ? 'var(--foreground)' : 'none'}
              strokeWidth={1.5}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
            />
          ))}
        </svg>
      </div>

      {hovered && (
        <div
          className="absolute z-20 bg-card border border-border rounded-xl shadow-warm-lg p-3 pointer-events-none max-w-[200px]"
          style={{
            left: Math.min(Math.max(mousePos.x - 100, 8), 700),
            top: mousePos.y + 20,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-bold text-sm">Day {hovered.day}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md text-white font-medium"
              style={{ backgroundColor: getSentimentColor(hovered.creatorSentiment) }}
            >
              {hovered.creatorSentiment}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Overall: <span className="font-medium text-foreground">{hovered.ratingOverall}/10</span>
            {' · '}
            Complexity: <span className="font-medium text-foreground">{hovered.ratingComplexity}/10</span>
          </div>
        </div>
      )}

      <div className="mt-4 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground italic">
          {trendData.peak ? (
            <>
              The data reveals a complexity sweet spot around{' '}
              <span className="font-semibold text-foreground not-italic">
                {trendData.peak.complexity.toFixed(0)}/10
              </span>{' '}
              complexity, where overall ratings peak at{' '}
              <span className="font-semibold text-foreground not-italic">
                {trendData.peak.rating.toFixed(1)}/10
              </span>
              . Push past that, and the flavors start canceling each other out. Zak flew too
              close to the sun.
            </>
          ) : (
            <>Exploring the relationship between complexity and overall taste ratings.</>
          )}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
        {SENTIMENT_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplexityTippingPoint;
