'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Ingredient } from '@/lib/actions';
import { getIngredientIcon, getSentimentColor } from '@/lib/utils';

interface IngredientBubblesProps {
  popular: Ingredient[];
  mvp: Ingredient[];
}

interface BubbleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  name: string;
  icon: string;
  timesAdded: number;
  impact: number;
  addedDay: number;
  isMvp: boolean;
}

function impactColor(impact: number): string {
  if (impact >= 1) return '#4A7C59';
  if (impact >= 0.3) return '#6B9A5E';
  if (impact >= 0) return '#C9943E';
  return '#BC4749';
}

const IngredientBubbles = ({ popular, mvp }: IngredientBubblesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const nodesRef = useRef<BubbleNode[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [, setTick] = useState(0);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 800, h: 400 });

  const allIngredients = useMemo(() => {
    const map = new Map<string, Ingredient & { isMvp: boolean }>();
    for (const ing of popular) map.set(ing.name, { ...ing, isMvp: false });
    for (const ing of mvp) {
      const existing = map.get(ing.name);
      if (existing) {
        existing.isMvp = true;
      } else {
        map.set(ing.name, { ...ing, isMvp: true });
      }
    }
    return Array.from(map.values());
  }, [popular, mvp]);

  const maxAdded = Math.max(...allIngredients.map((i) => i.timesAdded), 1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      const h = Math.min(440, Math.max(320, width * 0.45));
      setDims({ w: width, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { w, h } = dims;
    nodesRef.current = allIngredients.map((ing, i) => {
      const sizeNorm = ing.timesAdded / maxAdded;
      const r = 22 + sizeNorm * 48;
      const angle = (i / allIngredients.length) * Math.PI * 2;
      const spread = Math.min(w, h) * 0.28;
      return {
        x: w / 2 + Math.cos(angle) * spread * (0.5 + Math.random() * 0.5),
        y: h / 2 + Math.sin(angle) * spread * (0.5 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r,
        name: ing.name,
        icon: getIngredientIcon(ing.name),
        timesAdded: ing.timesAdded,
        impact: ing.impact,
        addedDay: ing.addedDay,
        isMvp: ing.isMvp,
      };
    });
  }, [allIngredients, maxAdded, dims]);

  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const { w, h } = dims;
    const mouse = mouseRef.current;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      // Gravity toward center
      a.vx += (w / 2 - a.x) * 0.0004;
      a.vy += (h / 2 - a.y) * 0.0004;

      // Mouse repulsion
      if (mouse.active) {
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const threshold = a.r + 80;
        if (dist < threshold && dist > 0) {
          const force = ((threshold - dist) / threshold) * 1.2;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
        }
      }

      // Repulsion between bubbles
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 6;
        if (dist < minDist && dist > 0) {
          const force = ((minDist - dist) / dist) * 0.15;
          a.vx -= dx * force;
          a.vy -= dy * force;
          b.vx += dx * force;
          b.vy += dy * force;
        }
      }

      // Damping
      a.vx *= 0.92;
      a.vy *= 0.92;

      // Update position
      a.x += a.vx;
      a.y += a.vy;

      // Bounce off walls
      if (a.x - a.r < 0) { a.x = a.r; a.vx = Math.abs(a.vx) * 0.5; }
      if (a.x + a.r > w) { a.x = w - a.r; a.vx = -Math.abs(a.vx) * 0.5; }
      if (a.y - a.r < 0) { a.y = a.r; a.vy = Math.abs(a.vy) * 0.5; }
      if (a.y + a.r > h) { a.y = h - a.r; a.vy = -Math.abs(a.vy) * 0.5; }
    }

    setTick((t) => t + 1);
    animRef.current = requestAnimationFrame(simulate);
  }, [dims]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [simulate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
    setHoveredName(null);
  }, []);

  const hovered = hoveredName ? nodesRef.current.find((n) => n.name === hoveredName) : null;

  return (
    <div className="relative" ref={containerRef}>
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          🫧 What&apos;s in the Pot
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          The bigger the bubble, the more it&apos;s been tossed in. Push them around —
          they don&apos;t bite.
        </p>
      </div>

      <div
        className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm overflow-hidden"
        style={{ height: dims.h }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          width={dims.w}
          height={dims.h}
          className="block"
        >
          <defs>
            <filter id="ib-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
          </defs>

          {nodesRef.current.map((n) => {
            const isHovered = hoveredName === n.name;
            const fill = impactColor(n.impact);
            const showLabel = n.r > 28 || isHovered;

            return (
              <g
                key={n.name}
                onMouseEnter={() => setHoveredName(n.name)}
                onMouseLeave={() => setHoveredName(null)}
                style={{ cursor: 'grab' }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? n.r + 4 : n.r}
                  fill={fill}
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  stroke={isHovered ? 'var(--foreground)' : fill}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={isHovered ? 0.6 : 0.25}
                  filter={isHovered ? 'url(#ib-shadow)' : undefined}
                />
                {n.isMvp && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 2}
                    fill="none"
                    stroke="#D9772F"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    opacity="0.5"
                  />
                )}
                <text
                  x={n.x}
                  y={n.y - (showLabel ? 4 : 0)}
                  textAnchor="middle"
                  fontSize={Math.min(n.r * 0.55, 22)}
                  pointerEvents="none"
                >
                  {n.icon}
                </text>
                {showLabel && (
                  <text
                    x={n.x}
                    y={n.y + n.r * 0.35}
                    textAnchor="middle"
                    fontSize={Math.min(Math.max(n.r * 0.22, 8), 12)}
                    fontWeight="600"
                    fill="white"
                    pointerEvents="none"
                    opacity="0.9"
                  >
                    {n.name.length > 12 ? n.name.slice(0, 11) + '…' : n.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {hovered && (
        <div
          className="absolute z-20 bg-card border border-border rounded-xl shadow-warm-lg p-3 pointer-events-none max-w-[200px]"
          style={{
            left: Math.min(Math.max(hovered.x - 100, 8), dims.w - 216),
            top: Math.max(hovered.y - hovered.r - 80, 60),
          }}
        >
          <div className="font-serif font-bold text-sm flex items-center gap-1.5">
            {hovered.icon} {hovered.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <div>
              Added <span className="font-medium text-foreground">{hovered.timesAdded}×</span>
            </div>
            <div>
              First appeared:{' '}
              <span className="font-medium text-foreground">Day {hovered.addedDay}</span>
            </div>
            <div>
              Impact:{' '}
              <span
                className="font-medium"
                style={{ color: impactColor(hovered.impact) }}
              >
                {hovered.impact > 0 ? '+' : ''}{hovered.impact}
              </span>
            </div>
            {hovered.isMvp && (
              <div className="text-broth-amber font-medium">🏆 Flavor Champion</div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-herb-green" />
          <span>High impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C9943E' }} />
          <span>Neutral impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-burnt-tomato" />
          <span>Negative impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-2.5 rounded-full border-2 border-dashed border-broth-amber bg-transparent" />
          <span>Flavor Champion</span>
        </div>
      </div>
    </div>
  );
};

export default IngredientBubbles;
