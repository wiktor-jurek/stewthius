'use client';

import { useRef, useState, useMemo } from 'react';
import { StewRating, VideoAnalysis } from '@/lib/actions';
import { getSentimentColor, seededRandom } from '@/lib/utils';
import { trackChartInteraction } from '@/lib/analytics';

interface BrothLineProps {
  ratings: StewRating[];
  videos: VideoAnalysis[];
}

type RatingType = 'overall' | 'richness' | 'complexity';

function catmullRom(points: number[][], tension = 0.5): string {
  if (points.length < 2) return '';

  const d: string[] = [`M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const t = 1 / tension;
    const cp1x = p1[0] + (p2[0] - p0[0]) / (6 * t);
    const cp1y = p1[1] + (p2[1] - p0[1]) / (6 * t);
    const cp2x = p2[0] - (p3[0] - p1[0]) / (6 * t);
    const cp2y = p2[1] - (p3[1] - p1[1]) / (6 * t);

    d.push(
      `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    );
  }

  return d.join(' ');
}

const BrothLine = ({ ratings, videos }: BrothLineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedRating, setSelectedRating] = useState<RatingType>('overall');

  const pad = { top: 24, right: 24, bottom: 36, left: 32 };
  const W = 960;
  const H = 280;
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const ingredientsByDay = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const v of videos) {
      if (v.ingredientsAdded?.length > 0) map.set(v.day, v.ingredientsAdded);
    }
    return map;
  }, [videos]);

  const quotesByDay = useMemo(() => {
    const map = new Map<number, string>();
    for (const v of videos) {
      if (v.keyQuote) map.set(v.day, v.keyQuote);
    }
    return map;
  }, [videos]);

  const ratingKey: keyof StewRating =
    selectedRating === 'overall'
      ? 'ratingOverall'
      : selectedRating === 'richness'
        ? 'ratingRichness'
        : 'ratingComplexity';

  const ribbonData = useMemo(() => {
    return ratings.map((r, i) => {
      const x = pad.left + (i / Math.max(ratings.length - 1, 1)) * plotW;
      const val = r[ratingKey] as number;
      const norm = val / 10;
      const baseY = pad.top + plotH * (1 - norm * 0.75 - 0.125);
      const wave = Math.sin(i * 0.18) * 3;

      const thickness = 3 + norm * 16;
      const sent = r.creatorSentiment.toLowerCase();
      const noiseMag =
        sent === 'negative' ? 14 : sent === 'experimental' ? 7 : sent === 'neutral' ? 2 : 0;

      const nU = (seededRandom(r.day * 7 + 1) - 0.5) * noiseMag;
      const nL = (seededRandom(r.day * 7 + 2) - 0.5) * noiseMag;

      return {
        x,
        centerY: baseY + wave,
        upperY: baseY - thickness + nU + wave,
        lowerY: baseY + thickness + nL + wave,
        rating: val,
        day: r.day,
        sentiment: r.creatorSentiment,
        color: getSentimentColor(r.creatorSentiment),
        ingredients: ingredientsByDay.get(r.day) || [],
        quote: quotesByDay.get(r.day),
        isInferred: r.ratingInferred,
      };
    });
  }, [ratings, ratingKey, ingredientsByDay, quotesByDay, plotW, plotH, pad.left, pad.top]);

  const ribbonPath = useMemo(() => {
    if (ribbonData.length < 2) return '';
    const upper = catmullRom(ribbonData.map((d) => [d.x, d.upperY]));
    const lowerPts = ribbonData.map((d) => [d.x, d.lowerY]).reverse();
    const lower = catmullRom(lowerPts);
    const last = ribbonData[ribbonData.length - 1];
    const first = ribbonData[0];
    return `${upper} L${last.x.toFixed(1)},${last.lowerY.toFixed(1)} ${lower} L${first.x.toFixed(1)},${first.upperY.toFixed(1)} Z`;
  }, [ribbonData]);

  const gradientStops = ribbonData.map((d, i) => ({
    offset: (i / Math.max(ribbonData.length - 1, 1)) * 100,
    color: d.color,
  }));

  const hovered = hoveredIndex !== null ? ribbonData[hoveredIndex] : null;

  const dayLabelStep = Math.max(1, Math.ceil(ratings.length / 12));

  return (
    <div
      className="relative"
      ref={containerRef}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          🍲 The Stew&apos;s Journey
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Thick and golden on good days, thin and jagged when things went wrong.
          The stew speaks through its shape.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {(['overall', 'richness', 'complexity'] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              trackChartInteraction('broth_line', 'filter_change', type);
              setSelectedRating(type);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium capitalize ${
              selectedRating === type
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm p-2 md:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[560px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="bl-grad" x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((s, i) => (
                <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
              ))}
            </linearGradient>
            <linearGradient id="bl-glow" x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((s, i) => (
                <stop key={i} offset={`${s.offset}%`} stopColor={s.color} stopOpacity="0.3" />
              ))}
            </linearGradient>
            <filter id="bl-blur">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          {[2, 4, 6, 8, 10].map((r) => {
            const y = pad.top + plotH * (1 - (r / 10) * 0.75 - 0.125);
            return (
              <g key={r}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={W - pad.right}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  opacity="0.25"
                />
                <text
                  x={pad.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="var(--muted-foreground)"
                  opacity="0.5"
                >
                  {r}
                </text>
              </g>
            );
          })}

          <path d={ribbonPath} fill="url(#bl-glow)" filter="url(#bl-blur)" />
          <path d={ribbonPath} fill="url(#bl-grad)" opacity="0.88" />

          {ribbonData.map((d, i) =>
            d.ingredients.length > 0 ? (
              <circle
                key={`dot-${i}`}
                cx={d.x}
                cy={d.centerY}
                r={hoveredIndex === i ? 5 : 2.5}
                fill="white"
                stroke={d.color}
                strokeWidth="1.5"
                opacity={hoveredIndex === i ? 1 : 0.7}
                className="transition-all duration-150"
              />
            ) : null
          )}

          {ribbonData.map((d, i) => {
            const sw = plotW / ratings.length;
            return (
              <rect
                key={`hit-${i}`}
                x={d.x - sw / 2}
                y={pad.top}
                width={sw}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                style={{ cursor: 'crosshair' }}
              />
            );
          })}

          {hovered && (
            <line
              x1={hovered.x}
              y1={pad.top}
              x2={hovered.x}
              y2={H - pad.bottom}
              stroke="var(--foreground)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.35"
            />
          )}

          {ribbonData
            .filter((_, i) => i % dayLabelStep === 0)
            .map((d) => (
              <text
                key={`lbl-${d.day}`}
                x={d.x}
                y={H - pad.bottom + 14}
                textAnchor="middle"
                fontSize="8"
                fill="var(--muted-foreground)"
              >
                {d.day}
              </text>
            ))}
        </svg>
      </div>

      {hovered && (
        <div
          className="absolute z-20 bg-card border border-border rounded-xl shadow-warm-lg p-3 pointer-events-none max-w-[220px] text-left"
          style={{
            left: Math.min(
              Math.max(mousePos.x - 110, 8),
              (containerRef.current?.clientWidth ?? 800) - 228
            ),
            top: mousePos.y + 16,
          }}
        >
          <div className="font-serif font-bold text-sm flex items-center gap-1.5">
            Day {hovered.day}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md text-white font-sans font-medium"
              style={{ backgroundColor: hovered.color }}
            >
              {hovered.sentiment}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Rating:{' '}
            <span className="font-medium text-foreground">{hovered.rating}/10</span>
            {hovered.isInferred && (
              <span className="text-broth-amber ml-1">(AI)</span>
            )}
          </div>
          {hovered.ingredients.length > 0 && (
            <div className="text-xs mt-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">Added:</span>{' '}
              {hovered.ingredients.join(', ')}
            </div>
          )}
          {hovered.quote && (
            <p className="text-[11px] italic text-muted-foreground mt-1.5 line-clamp-2">
              &ldquo;{hovered.quote}&rdquo;
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        {[
          { label: 'Positive', color: '#4A7C59' },
          { label: 'Experimental', color: '#7B5EA7' },
          { label: 'Neutral', color: '#C9943E' },
          { label: 'Negative', color: '#BC4749' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white border border-border" />
          <span>Ingredients added</span>
        </div>
      </div>
    </div>
  );
};

export default BrothLine;
