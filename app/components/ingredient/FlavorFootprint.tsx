'use client';

import { useMemo, useState } from 'react';
import { FlavorFootprintData } from '@/lib/actions';

interface FlavorFootprintProps {
  data: FlavorFootprintData;
  ingredientName: string;
}

const AXES = [
  { key: 'richness' as const, label: 'Richness' },
  { key: 'complexity' as const, label: 'Complexity' },
  { key: 'thickness' as const, label: 'Thickness' },
  { key: 'clarity' as const, label: 'Clarity' },
  { key: 'overall' as const, label: 'Overall' },
];

const MAX_VALUE = 20;

function polarToCartesian(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  values: number[],
  maxVal: number,
): string {
  return values
    .map((v, i) => {
      const r = (v / maxVal) * radius;
      const { x, y } = polarToCartesian(cx, cy, r, i, values.length);
      return `${x},${y}`;
    })
    .join(' ');
}

const FlavorFootprint = ({ data, ingredientName }: FlavorFootprintProps) => {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  const cx = 160;
  const cy = 150;
  const radius = 110;

  const ingredientValues = AXES.map((a) => data.ingredient[a.key]);
  const globalValues = AXES.map((a) => data.global[a.key]);

  const allZero = ingredientValues.every((v) => v === 0);
  if (allZero) return null;

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          🕸️ Flavor Footprint
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          How does {ingredientName} shift the stew&apos;s profile? The solid shape is its average
          effect, overlaid against the global stew average.
        </p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-6 flex flex-col items-center">
        <svg width={320} height={320} viewBox="0 0 320 320" className="max-w-full">
          {/* Rings */}
          {rings.map((pct) => {
            const r = radius * pct;
            const points = AXES.map((_, i) => {
              const { x, y } = polarToCartesian(cx, cy, r, i, AXES.length);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={pct}
                points={points}
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}

          {/* Axis lines */}
          {AXES.map((_, i) => {
            const { x, y } = polarToCartesian(cx, cy, radius, i, AXES.length);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}

          {/* Global average polygon */}
          <polygon
            points={polygonPoints(cx, cy, radius, globalValues, MAX_VALUE)}
            fill="var(--muted-foreground)"
            fillOpacity="0.08"
            stroke="var(--muted-foreground)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.6"
          />

          {/* Ingredient polygon */}
          <polygon
            points={polygonPoints(cx, cy, radius, ingredientValues, MAX_VALUE)}
            fill="var(--primary)"
            fillOpacity="0.2"
            stroke="var(--primary)"
            strokeWidth="2"
          />

          {/* Dots on ingredient polygon */}
          {ingredientValues.map((v, i) => {
            const r = (v / MAX_VALUE) * radius;
            const { x, y } = polarToCartesian(cx, cy, r, i, AXES.length);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={hoveredAxis === i ? 5 : 3.5}
                fill="var(--primary)"
                stroke="var(--card)"
                strokeWidth="2"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              />
            );
          })}

          {/* Labels */}
          {AXES.map((axis, i) => {
            const labelR = radius + 22;
            const { x, y } = polarToCartesian(cx, cy, labelR, i, AXES.length);
            const isHovered = hoveredAxis === i;
            return (
              <g key={axis.key}>
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isHovered ? '12' : '11'}
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? 'var(--foreground)' : 'var(--muted-foreground)'}
                  fontFamily="var(--font-sans)"
                  className="transition-all"
                  onMouseEnter={() => setHoveredAxis(i)}
                  onMouseLeave={() => setHoveredAxis(null)}
                >
                  {axis.label}
                </text>
                {isHovered && (
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--primary)"
                    fontFamily="var(--font-sans)"
                    fontWeight="600"
                  >
                    {ingredientValues[i]} vs {globalValues[i]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex gap-6 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-primary rounded" />
            <span>{ingredientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 border-t-2 border-dashed border-muted-foreground/60 rounded" />
            <span>Global Avg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlavorFootprint;
