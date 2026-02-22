'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Ingredient } from '@/lib/actions';
import { getIngredientIcon, seededRandom } from '@/lib/utils';

interface IngredientBubblesProps {
  popular: Ingredient[];
  mvp: Ingredient[];
}

interface BubbleNode {
  x: number;
  y: number;
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

function resolveCollisions(nodes: BubbleNode[], iterations = 80) {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = nodes[i].r + nodes[j].r + 2;
        if (dist < minDist && dist > 0) {
          const overlap = ((minDist - dist) / dist) * 0.25;
          nodes[i].x -= dx * overlap * 0.3;
          nodes[i].y -= dy * overlap;
          nodes[j].x += dx * overlap * 0.3;
          nodes[j].y += dy * overlap;
        }
      }
    }
  }
}

const VW = 1400;
const VH = 700;
const PAD = 80;

const ZONE_DEFS = [
  { label: 'Troublemakers', min: -Infinity, max: -0.3 },
  { label: 'Wallflowers', min: -0.3, max: 0.3 },
  { label: 'Steady Hands', min: 0.3, max: 1.0 },
  { label: 'Flavor Boosters', min: 1.0, max: Infinity },
];

const IngredientBubbles = ({ popular, mvp }: IngredientBubblesProps) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: VW, h: VH });
  const viewBoxRef = useRef(viewBox);
  viewBoxRef.current = viewBox;
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

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

  const nodes = useMemo(() => {
    const maxAdded = Math.max(...allIngredients.map((i) => i.timesAdded), 1);
    const impacts = allIngredients.map((i) => i.impact);
    const minImpact = Math.min(...impacts, -1);
    const maxImpact = Math.max(...impacts, 1);
    const range = maxImpact - minImpact || 1;

    const count = allIngredients.length;
    const rScale = count > 30 ? Math.max(0.5, 22 / count) : 1;

    const result: BubbleNode[] = allIngredients.map((ing, i) => {
      const sizeNorm = ing.timesAdded / maxAdded;
      const r = Math.max(8, (14 + sizeNorm * 34) * rScale);
      const impactNorm = (ing.impact - minImpact) / range;
      const x =
        PAD + impactNorm * (VW - 2 * PAD) + (seededRandom(i * 31) - 0.5) * 40;
      const y = VH / 2 + (seededRandom(i * 17) - 0.5) * VH * 0.5;

      return {
        x,
        y,
        r,
        name: ing.name,
        icon: getIngredientIcon(ing.name),
        timesAdded: ing.timesAdded,
        impact: ing.impact,
        addedDay: ing.addedDay,
        isMvp: ing.isMvp,
      };
    });

    result.sort((a, b) => b.r - a.r);
    resolveCollisions(result);

    for (const n of result) {
      n.x = Math.max(n.r + 4, Math.min(VW - n.r - 4, n.x));
      n.y = Math.max(n.r + 4, Math.min(VH - n.r - 4, n.y));
    }

    return result;
  }, [allIngredients]);

  const zoneLabels = useMemo(() => {
    return ZONE_DEFS.map((z) => {
      const zn = nodes.filter((n) => n.impact >= z.min && n.impact < z.max);
      if (zn.length === 0) return null;
      const cx = zn.reduce((s, n) => s + n.x, 0) / zn.length;
      const cy = zn.reduce((s, n) => s + n.y, 0) / zn.length;
      return { ...z, x: cx, y: cy, count: zn.length };
    }).filter(Boolean) as {
      label: string;
      x: number;
      y: number;
      count: number;
    }[];
  }, [nodes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const vb = viewBoxRef.current;
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      const newW = Math.min(VW * 2.5, Math.max(200, vb.w * factor));
      const newH = Math.min(VH * 2.5, Math.max(100, vb.h * factor));
      setViewBox({
        x: vb.x + (vb.w - newW) * mx,
        y: vb.y + (vb.h - newH) * my,
        w: newW,
        h: newH,
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    const scaleX = viewBoxRef.current.w / rect.width;
    const scaleY = viewBoxRef.current.h / rect.height;
    setViewBox((vb) => ({
      ...vb,
      x: vb.x - dx * scaleX,
      y: vb.y - dy * scaleY,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const hovered = hoveredName
    ? nodes.find((n) => n.name === hoveredName)
    : null;

  return (
    <div className="relative">
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
          🫧 What&apos;s in the Pot
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Every ingredient that&apos;s entered the stew, clustered by impact.
          Scroll to zoom, drag to pan.
        </p>
      </div>

      <div
        ref={containerRef}
        className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm overflow-hidden select-none"
        style={{ height: 440, cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block"
        >
          <defs>
            <filter id="ib-shadow">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodOpacity="0.12"
              />
            </filter>
          </defs>

          {zoneLabels.map((z) => (
            <text
              key={z.label}
              x={z.x}
              y={z.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="serif"
              fontSize="28"
              fontWeight="600"
              fontStyle="italic"
              fill="var(--foreground)"
              opacity="0.07"
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {z.label}
            </text>
          ))}

          {nodes.map((n) => {
            const isHovered = hoveredName === n.name;
            const fill = impactColor(n.impact);
            const showLabel = n.r > 10 || isHovered;

            return (
              <g
                key={n.name}
                onMouseEnter={() => {
                  if (!isPanning.current) setHoveredName(n.name);
                }}
                onMouseLeave={() => setHoveredName(null)}
                onClick={(e) => {
                  if (isPanning.current) return;
                  e.stopPropagation();
                  router.push(
                    `/ingredient/${encodeURIComponent(n.name.toLowerCase().replace(/\s+/g, '-'))}`,
                  );
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? n.r + 2 : n.r}
                  fill={fill}
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  stroke={isHovered ? 'var(--foreground)' : fill}
                  strokeWidth={isHovered ? 1.5 : 0.5}
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
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    opacity="0.5"
                  />
                )}
                <text
                  x={n.x}
                  y={n.y - (showLabel ? 2 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.min(n.r * 0.7, 14)}
                  pointerEvents="none"
                >
                  {n.icon}
                </text>
                {showLabel && (
                  <text
                    x={n.x}
                    y={n.y + n.r * 0.5}
                    textAnchor="middle"
                    fontSize={Math.min(Math.max(n.r * 0.28, 5), 9)}
                    fontWeight="600"
                    fill="white"
                    pointerEvents="none"
                    opacity="0.9"
                  >
                    {n.name.length > 14 ? n.name.slice(0, 13) + '…' : n.name}
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
            left: Math.min(
              Math.max(mousePos.x - 100, 8),
              (containerRef.current?.clientWidth ?? 800) - 216,
            ),
            top: mousePos.y + 20,
          }}
        >
          <div className="font-serif font-bold text-sm flex items-center gap-1.5">
            {hovered.icon} {hovered.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <div>
              Added{' '}
              <span className="font-medium text-foreground">
                {hovered.timesAdded}×
              </span>
            </div>
            <div>
              First appeared:{' '}
              <span className="font-medium text-foreground">
                Day {hovered.addedDay}
              </span>
            </div>
            <div>
              Impact:{' '}
              <span
                className="font-medium"
                style={{ color: impactColor(hovered.impact) }}
              >
                {hovered.impact > 0 ? '+' : ''}
                {hovered.impact}
              </span>
            </div>
            {hovered.isMvp && (
              <div className="text-broth-amber font-medium">
                🏆 Flavor Champion
              </div>
            )}
            <div className="text-primary font-medium mt-0.5">
              Click for details →
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-herb-green" />
          <span>High impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: '#C9943E' }}
          />
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
