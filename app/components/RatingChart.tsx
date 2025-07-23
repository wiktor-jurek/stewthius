'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StewRating } from '@/lib/actions';

interface RatingChartProps {
  ratings: StewRating[];
}

const RatingChart = ({ ratings }: RatingChartProps) => {
  const chartData = ratings.map(rating => ({
    day: rating.day,
    rating: rating.ratingOverall,
    richness: rating.ratingRichness,
    complexity: rating.ratingComplexity
  }));

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Stew Rating Evolution
        </CardTitle>
        <CardDescription>
          Track how the stew&apos;s taste profile has evolved over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 10]} 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="hsl(var(--stew-amber))" 
                strokeWidth={3}
                name="Overall Rating"
                dot={{ fill: 'hsl(var(--stew-amber))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="richness" 
                stroke="hsl(var(--stew-sage))" 
                strokeWidth={2}
                name="Richness"
                dot={{ fill: 'hsl(var(--stew-sage))', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="complexity" 
                stroke="hsl(var(--stew-terracotta))" 
                strokeWidth={2}
                name="Complexity"
                dot={{ fill: 'hsl(var(--stew-terracotta))', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RatingChart;