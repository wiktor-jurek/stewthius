'use client';

import { useState, useMemo } from 'react';
import { ClarityRichnessPoint } from '@/lib/actions';
import { getSentimentColor } from '@/lib/utils';

interface ClarityRichnessMatrixProps {
  data: ClarityRichnessPoint[];
}

const W = 800;
const H = 520;
const M = { top: 30, right: 30, bottom: 55, left: 55 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const SENTIMENT_LEGEND = [
  { label: 'Super Positive', color: '#2D6A4F' },
  { label: 'Positive', color: '#4A7C59' },
  { label: 'Neutral', color: '#C9943E' },
  { label: 'Negative', color: '#BC4749' },
  { label: 'Super Negative', color: '#7B2D35' },
];

const ClarityRichnessMatrix = ({ data }: ClarityRichnessMatrixProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { xMax, yMax } = useMemo(() => {
    if (data.length === 0) return { xMax: 20, yMax: 20 };
    const maxC = Math.max(...data.map((d) => d.clarity));
    const maxT = Math.max(...data.map((d) => d.thickness));
    return {
      xMax: Math.ceil(maxC / 2) * 2 + 2,
      yMax: Math.ceil(maxT / 2) * 2 + 2,
    };
  }, [data]);

  const perfectionZone = useMemo(() => {
    const positives = data.filter((d) =>
      ['Super Positive', 'Positive'].includes(d.sentiment),
    );
    if (positives.length < 5) return null;
    const avgC = positives.reduce((s, p) => s + p.clarity, 0) / positives.length;
    const avgT = positives.reduce((s, p) => s + p.thickness, 0) / positives.length;
    const stdC = Math.sqrt(
      positives.reduce((s, p) => s + Math.pow(p.clarity - avgC, 2), 0) / positives.length,
    );
    const stdT = Math.sqrt(
      positives.reduce((s, p) => s + Math.pow(p.thickness - avgT, 2), 0) / positives.length,
    );
    return { avgC, avgT, stdC, stdT };
  }, [data]);

  const xScale = (v: number) => M.left + (v / xMax) * PW;
  const yScale = (v: number) => M.top + (1 - v / yMax) * PH;

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = xMax <= 12 ? 2 : 4;
    for (let v = 0; v <= xMax; v += step) ticks.push(v);
    return ticks;
  }, [xMax]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = yMax <= 12 ? 2 : 4;
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    return ticks;
  }, [yMax]);

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
          🔬 The Clarity-Richness Matrix
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Does a thick, murky soup taste better than a clear broth? Each dot is a day in the
          stew&apos;s life — colored by how Zak felt about the result.
        </p>
      </div>

      <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {xTicks.map((v) => (
            <g key={`xg-${v}`}>
              <line
                x1={xScale(v)} y1={M.top}
                x2={xScale(v)} y2={M.top + PH}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4"
              />
              <text
                x={xScale(v)} y={M.top + PH + 16}
                textAnchor="middle" fontSize="10" fill="var(--muted-foreground)"
              >
                {v}
              </text>
            </g>
          ))}
          {yTicks.map((v) => (
            <g key={`yg-${v}`}>
              <line
                x1={M.left} y1={yScale(v)}
                x2={M.left + PW} y2={yScale(v)}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4"
              />
              <text
                x={M.left - 10} y={yScale(v) + 4}
                textAnchor="end" fontSize="10" fill="var(--muted-foreground)"
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
            Appearance Clarity →
          </text>
          <text
            x={14} y={M.top + PH / 2}
            textAnchor="middle" fontSize="12" fill="var(--muted-foreground)" fontWeight="500"
            transform={`rotate(-90 14 ${M.top + PH / 2})`}
          >
            Texture Thickness →
          </text>

          {/* Zone of Perfection */}
          {perfectionZone && (
            <g>
              <ellipse
                cx={xScale(perfectionZone.avgC)}
                cy={yScale(perfectionZone.avgT)}
                rx={Math.max(25, (perfectionZone.stdC / xMax) * PW * 2)}
                ry={Math.max(25, (perfectionZone.stdT / yMax) * PH * 2)}
                fill="var(--chart-2)" opacity="0.06"
                stroke="var(--chart-2)" strokeWidth="1"
                strokeDasharray="6,4" strokeOpacity="0.3"
              />
              <text
                x={xScale(perfectionZone.avgC)}
                y={yScale(perfectionZone.avgT) - Math.max(25, (perfectionZone.stdT / yMax) * PH * 2) - 8}
                textAnchor="middle" fontSize="10" fill="var(--chart-2)" fontWeight="600" opacity="0.6"
              >
                ✨ Zone of Perfection
              </text>
            </g>
          )}

          {/* Corner zone labels */}
          <text x={M.left + 8} y={M.top + 16} fontSize="9" fill="var(--muted-foreground)" opacity="0.4">
            Thick & Murky
          </text>
          <text x={M.left + PW - 8} y={M.top + 16} fontSize="9" fill="var(--muted-foreground)" opacity="0.4" textAnchor="end">
            Thick & Clear
          </text>
          <text x={M.left + 8} y={M.top + PH - 8} fontSize="9" fill="var(--muted-foreground)" opacity="0.4">
            Thin & Murky
          </text>
          <text x={M.left + PW - 8} y={M.top + PH - 8} fontSize="9" fill="var(--muted-foreground)" opacity="0.4" textAnchor="end">
            Thin & Clear
          </text>

          {/* Data dots */}
          {data.map((d, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <circle
                key={i}
                cx={xScale(d.clarity)}
                cy={yScale(d.thickness)}
                r={isHovered ? 6 : 4}
                fill={getSentimentColor(d.sentiment)}
                fillOpacity={0.7}
                stroke={isHovered ? 'var(--foreground)' : 'none'}
                strokeWidth={1.5}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              />
            );
          })}
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
              style={{ backgroundColor: getSentimentColor(hovered.sentiment) }}
            >
              {hovered.sentiment}
            </span>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>
              Clarity: <span className="font-medium text-foreground">{hovered.clarity}</span>
            </div>
            <div>
              Thickness: <span className="font-medium text-foreground">{hovered.thickness}</span>
            </div>
            <div>
              Rating: <span className="font-medium text-foreground">{hovered.rating}/10</span>
            </div>
          </div>
        </div>
      )}

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

      <div className="mt-4 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground italic">
          The data maps out the broth&apos;s texture space. If the soup is too clear,
          it&apos;s boring. If it&apos;s too thick, it&apos;s sludge. But right in the
          middle sits the{' '}
          <span className="font-semibold text-herb-green not-italic">Zone of Perfection</span>{' '}
          — where the green dots cluster. That&apos;s perpetual soup heaven.
        </p>
      </div>
    </div>
  );
};

export default ClarityRichnessMatrix;
