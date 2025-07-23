'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentData } from '@/lib/actions';

interface SentimentChartProps {
  data: SentimentData[];
}

const SentimentChart = ({ data }: SentimentChartProps) => {
  const COLORS = {
    'Positive': 'hsl(var(--stew-amber))',
    'Neutral': 'hsl(var(--stew-sage))',
    'Negative': 'hsl(var(--stew-terracotta))',
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          😊 Creator Sentiment
        </CardTitle>
        <CardDescription>
          Overall mood and sentiment analysis from stew updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="h-64 w-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  label={(entry) => `${entry.percentage}%`}
                  labelLine={false}
                >
                  {data.map((entry) => (
                    <Cell 
                      key={`cell-${entry.sentiment}`} 
                      fill={COLORS[entry.sentiment as keyof typeof COLORS]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Count']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.map((item) => (
            <div key={item.sentiment} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[item.sentiment as keyof typeof COLORS] }}
              />
              <span className="text-sm">
                {item.sentiment}: {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-accent rounded-lg text-accent-foreground">
          <h4 className="font-semibold mb-2">📈 Sentiment Trends</h4>
          <p className="text-sm opacity-90">
            Based on {total} analyzed updates. Sentiment reflects the creator&apos;s mood and 
            reaction to each day&apos;s stew tasting experience.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentChart;