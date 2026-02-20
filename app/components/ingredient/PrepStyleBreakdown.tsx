'use client';

import { useState } from 'react';
import { PrepStyleData } from '@/lib/actions';

interface PrepStyleBreakdownProps {
  data: PrepStyleData[];
  ingredientName: string;
}

const PREP_ICONS: Record<string, string> = {
  Raw: '🥬',
  Roasted: '🔥',
  'Sautéed': '🍳',
  Boiled: '♨️',
  Leftover: '📦',
  Scrap: '🗑️',
  Jarred: '🫙',
  Fried: '🍟',
  Grilled: '🔥',
  Smoked: '💨',
  Steamed: '♨️',
  Braised: '🥘',
  Baked: '🍞',
  Pickled: '🥒',
  Dried: '🌿',
  Canned: '🥫',
  Frozen: '🧊',
  Marinated: '🫗',
  Fermented: '🧪',
  Powdered: '✨',
  Caramelized: '🍯',
  Cured: '🧂',
  Mashed: '🥔',
  Confit: '🍗',
  Blanched: '♨️',
  Poached: '🥚',
  Infused: '🫖',
};

const COLORS = [
  '#D9772F', '#4A7C59', '#BC4749', '#C9943E', '#7B5EA7',
  '#5BA3C9', '#D4585A', '#8B7355', '#6B9A5E', '#A0896F',
];

const PrepStyleBreakdown = ({ data, ingredientName }: PrepStyleBreakdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 90;
  const cy = 90;
  const outerR = 80;
  const innerR = 45;

  let angleOffset = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const fraction = d.count / total;
    const startAngle = angleOffset;
    const endAngle = angleOffset + fraction * Math.PI * 2;
    angleOffset = endAngle;

    const largeArc = fraction > 0.5 ? 1 : 0;
    const r = hoveredIndex === i ? outerR + 4 : outerR;
    const ir = hoveredIndex === i ? innerR - 2 : innerR;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + ir * Math.cos(endAngle);
    const iy1 = cy + ir * Math.sin(endAngle);
    const ix2 = cx + ir * Math.cos(startAngle);
    const iy2 = cy + ir * Math.sin(startAngle);

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { path, color: COLORS[i % COLORS.length], ...d, fraction, i };
  });

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-1">
          🍳 Prep Style Breakdown
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          How does {ingredientName} enter the pot?
        </p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-warm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg width={180} height={180} viewBox="0 0 180 180" className="shrink-0">
            {arcs.map((arc) => (
              <path
                key={arc.style}
                d={arc.path}
                fill={arc.color}
                fillOpacity={hoveredIndex === arc.i ? 1 : 0.75}
                stroke="var(--card)"
                strokeWidth="2"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(arc.i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
            {/* Center label */}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fill="var(--foreground)"
              fontFamily="var(--font-serif)"
            >
              {total}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted-foreground)"
              fontFamily="var(--font-sans)"
            >
              additions
            </text>
          </svg>

          <div className="flex-1 w-full space-y-1.5">
            {data.map((d, i) => (
              <div
                key={d.style}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-default ${
                  hoveredIndex === i ? 'bg-muted/50' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="text-base w-6 text-center shrink-0">
                  {PREP_ICONS[d.style] || '🥄'}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">{d.style}</span>
                <span className="text-xs text-muted-foreground">{d.count}×</span>
                <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.percentage}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrepStyleBreakdown;
