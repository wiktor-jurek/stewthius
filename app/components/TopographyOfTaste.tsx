'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { VideoAnalysis, VideoEmbeddingPosition } from '@/lib/actions';
import { getSentimentColor, seededRandom } from '@/lib/utils';

interface TopographyOfTasteProps {
  videos: VideoAnalysis[];
  positions: VideoEmbeddingPosition[];
}

type Zone = 'stewphoria' | 'despair' | 'experimental' | 'bland';

interface BubbleNode {
  x: number;
  y: number;
  r: number;
  day: number;
  rating: number;
  sentiment: string;
  zone: Zone;
  ingredients: string[];
  quote?: string;
  engagement: number;
  color: string;
}

const ZONE_META: Record<Zone, { label: string; description: string }> = {
  stewphoria: {
    label: 'Stewphoria',
    description: 'Golden days of flavor perfection',
  },
  despair: {
    label: 'Valley of Despair',
    description: 'When the pot went dark',
  },
  experimental: {
    label: 'Wild Card',
    description: 'Bold experiments and mad science',
  },
  bland: {
    label: 'The Bland Lands',
    description: 'Steady simmering, nothing fancy',
  },
};

const SENTIMENT_LEGEND: { key: string; label: string; color: string }[] = [
  { key: 'super positive', label: 'Super Positive', color: '#2D6A4F' },
  { key: 'positive', label: 'Positive', color: '#4A7C59' },
  { key: 'neutral', label: 'Neutral', color: '#C9943E' },
  { key: 'negative', label: 'Negative', color: '#BC4749' },
  { key: 'super negative', label: 'Super Negative', color: '#7B2D35' },
];

function classifyZone(rating: number, sentiment: string): Zone {
  const s = sentiment.toLowerCase();
  if (rating >= 8 && (s === 'positive' || s === 'super positive')) return 'stewphoria';
  if (rating <= 5 && (s === 'negative' || s === 'super negative')) return 'despair';
  if (s === 'super positive' || s === 'super negative') return 'experimental';
  return 'bland';
}

function resolveCollisions(nodes: BubbleNode[], iterations = 30) {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = nodes[i].r + nodes[j].r + 1;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / dist * 0.15;
          nodes[i].x -= dx * overlap;
          nodes[i].y -= dy * overlap;
          nodes[j].x += dx * overlap;
          nodes[j].y += dy * overlap;
        }
      }
    }
  }
}

const PADDING = 60;

const TopographyOfTaste = ({ videos, positions }: TopographyOfTasteProps) => {
  const router = useRouter();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const W = 960;
  const H = 520;

  const positionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of positions) {
      map.set(p.videoId, { x: p.x, y: p.y });
    }
    return map;
  }, [positions]);

  const hasEmbeddings = positions.length > 0;

  const nodes = useMemo(() => {
    const result: BubbleNode[] = videos.map((v) => {
      const zone = classifyZone(v.ratingOverall, v.sentiment);
      const engagement = Math.log10(Math.max(v.viewCount || 1, 1));
      const r = 4 + Math.min(engagement, 7) * 1.2;

      let x: number, y: number;
      const pos = positionMap.get(v.videoId);

      if (pos) {
        x = PADDING + pos.x * (W - 2 * PADDING);
        y = PADDING + pos.y * (H - 2 * PADDING);
      } else {
        const angle = seededRandom(v.day * 31) * Math.PI * 2;
        const dist = seededRandom(v.day * 17) * 0.3;
        x = W / 2 + Math.cos(angle) * W * dist;
        y = H / 2 + Math.sin(angle) * H * dist;
      }

      return {
        x, y, r,
        day: v.day,
        rating: v.ratingOverall,
        sentiment: v.sentiment,
        zone,
        ingredients: v.ingredientsAdded || [],
        quote: v.keyQuote,
        engagement,
        color: getSentimentColor(v.sentiment),
      };
    });

    resolveCollisions(result);

    for (const n of result) {
      n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x));
      n.y = Math.max(n.r + 4, Math.min(H - n.r - 4, n.y));
    }

    return result;
  }, [videos, positionMap]);

  const hovered = hoveredDay !== null ? nodes.find((n) => n.day === hoveredDay) : null;

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
          🗺️ The Topography of Taste
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {hasEmbeddings
            ? "Every bubble is a day in the stew\u2019s life. Days with similar content cluster together. Hover to explore."
            : "Every bubble is a day in the stew\u2019s life. Hover to explore the peaks of Stewphoria and the murky depths of the Valley of Despair."}
        </p>
      </div>

      <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-warm overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="bubble-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="pot-vignette" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(45,42,38,0.08)" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="url(#pot-vignette)" />

          {nodes.map((n) => {
            const isHovered = hoveredDay === n.day;
            const isStewphoria = n.zone === 'stewphoria';
            return (
              <g key={n.day}>
                {isStewphoria && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 3}
                    fill={n.color}
                    opacity="0.15"
                    filter="url(#bubble-glow)"
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? n.r + 2 : n.r}
                  fill={n.color}
                  fillOpacity={n.zone === 'despair' ? 0.55 : 0.75}
                  stroke={isHovered ? 'var(--foreground)' : n.color}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  strokeOpacity={isHovered ? 0.8 : 0.3}
                  onMouseEnter={() => setHoveredDay(n.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => router.push(`/video/${n.day}`)}
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                />
                {isHovered && (
                  <text
                    x={n.x}
                    y={n.y + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill="white"
                    pointerEvents="none"
                  >
                    {n.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {hovered && (
        <div
          className="absolute z-20 bg-card border border-border rounded-xl shadow-warm-lg p-3 pointer-events-none max-w-[240px]"
          style={{
            left: Math.min(Math.max(mousePos.x - 120, 8), (typeof window !== 'undefined' ? window.innerWidth : 960) - 260),
            top: mousePos.y + 20,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-bold text-sm">Day {hovered.day}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md text-white font-medium"
              style={{ backgroundColor: hovered.color }}
            >
              {hovered.sentiment}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Rating: <span className="font-medium text-foreground">{hovered.rating}/10</span>
            {' · '}
            Zone: <span className="font-medium text-foreground">{ZONE_META[hovered.zone].label}</span>
          </div>
          {hovered.ingredients.length > 0 && (
            <div className="text-xs mt-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">Added:</span>{' '}
              {hovered.ingredients.join(', ')}
            </div>
          )}
          {hovered.quote && (
            <p className="text-[11px] italic text-muted-foreground mt-1.5 line-clamp-3">
              &ldquo;{hovered.quote}&rdquo;
            </p>
          )}
          <div className="text-[10px] text-primary font-medium mt-1.5">Click to explore →</div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
        {SENTIMENT_LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
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

export default TopographyOfTaste;
