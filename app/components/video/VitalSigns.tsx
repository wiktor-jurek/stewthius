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
import type { VideoDetail } from '@/lib/actions';

interface VitalSignsProps {
  video: VideoDetail;
  globalAverages: {
    richness: number;
    complexity: number;
    thickness: number;
    clarity: number;
    overall: number;
  };
}

export default function VitalSigns({ video, globalAverages }: VitalSignsProps) {
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
          Today&apos;s physical properties overlaid against the all-time stew average
          {confidence != null && confidence < 70 && (
            <span className="text-broth-amber"> — AI confidence is low, chart faded accordingly</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-2/3 h-[320px]">
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
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Broth Color
              </div>
              <div className="text-sm font-medium text-center">
                {video.appearanceColor}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
