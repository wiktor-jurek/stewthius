'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { VideoDetail, DayDelta } from '@/lib/actions';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalSignsProps {
  video: VideoDetail;
  globalAverages: {
    richness: number;
    complexity: number;
    thickness: number;
    clarity: number;
    overall: number;
  };
  deltas?: DayDelta[];
}

export default function VitalSigns({ video, globalAverages, deltas }: VitalSignsProps) {
  const data = [
    {
      property: 'Overall',
      today: video.ratingOverall,
      average: globalAverages.overall,
    },
    {
      property: 'Richness',
      today: video.ratingRichness,
      average: globalAverages.richness,
    },
    {
      property: 'Complexity',
      today: video.ratingComplexity,
      average: globalAverages.complexity,
    },
    {
      property: 'Thickness',
      today: video.textureThickness ?? 0,
      average: globalAverages.thickness,
    },
    {
      property: 'Clarity',
      today: video.appearanceClarity ?? 0,
      average: globalAverages.clarity,
    },
  ];

  const confidence = video.ratingOverallConfidence;
  const opacity = confidence != null ? Math.max(0.3, confidence / 100) : 1;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🩺 The Broth&apos;s Vital Signs
        </CardTitle>
        <CardDescription>
          Day-over-day movement and today&apos;s properties vs. the all-time average
          {confidence != null && confidence < 70 && (
            <span className="text-broth-amber"> (low AI confidence — chart faded)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deltas && deltas.length > 0 && (
          <div className="flex border border-border/30 rounded-xl overflow-hidden mb-6">
            {deltas.map((d, i) => {
              const isPositive = d.delta !== null && d.delta > 0;
              const isNegative = d.delta !== null && d.delta < 0;

              return (
                <div
                  key={d.metric}
                  className={`flex-1 text-center py-3 px-1.5 bg-background/60 ${
                    i > 0 ? 'border-l border-border/30' : ''
                  }`}
                >
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 truncate">
                    {d.metric}
                  </div>
                  <div className="text-lg font-bold font-serif leading-tight">
                    {d.current}
                    <span className="text-[10px] font-normal text-muted-foreground">/10</span>
                  </div>
                  {d.delta !== null ? (
                    <div
                      className={`flex items-center justify-center gap-0.5 text-xs font-semibold mt-0.5 ${
                        isPositive
                          ? 'text-herb-green'
                          : isNegative
                            ? 'text-burnt-tomato'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {isPositive && <TrendingUp className="h-3 w-3" />}
                      {isNegative && <TrendingDown className="h-3 w-3" />}
                      {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
                      <span>
                        {isPositive && '+'}
                        {d.delta}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground mt-0.5">—</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="property"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: 10 }}
                tickCount={6}
              />
              <Radar
                name="All-Time Average"
                dataKey="average"
                stroke="#8B7355"
                fill="#8B7355"
                fillOpacity={0.1}
                strokeDasharray="4 4"
              />
              <Radar
                name={`Day ${video.day}`}
                dataKey="today"
                stroke="#D9772F"
                fill="#D9772F"
                fillOpacity={0.25 * opacity}
                strokeWidth={2}
                strokeOpacity={opacity}
              />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 12px rgba(217, 119, 47, 0.08)',
                }}
                formatter={(value: number) => `${value}/10`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {video.appearanceColor && (
          <div className="flex items-center justify-center gap-2 mt-3 text-sm">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
              Broth Color:
            </span>
            <span className="font-medium">{video.appearanceColor}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
