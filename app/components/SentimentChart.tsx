'use client';

import { PieChart, Pie } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { SentimentData } from '@/lib/actions';

interface SentimentChartProps {
  data: SentimentData[];
}

const SentimentChart = ({ data }: SentimentChartProps) => {
  const chartConfig = {
    positive: {
      label: "Positive",
      color: "hsla(120, 70%, 50%, 1.0)",
    },
    experimental: {
      label: "Experimental", 
      color: "hsla(280, 70%, 60%, 1.0)",
    },
    neutral: {
      label: "Neutral",
      color: "hsla(45, 90%, 55%, 1.0)",
    },
    negative: {
      label: "Negative",
      color: "hsla(0, 70%, 50%, 1.0)",
    },
  } satisfies ChartConfig;

  const getSentimentColor = (sentiment: string) => {
    const key = sentiment.toLowerCase() as keyof typeof chartConfig;
    return chartConfig[key]?.color || 'hsla(210, 10%, 60%, 1.0)';
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Transform data to work better with shadcn charts
  const chartData = data.map(item => ({
    ...item,
    name: item.sentiment,
    fill: getSentimentColor(item.sentiment)
  }));
  
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
            <ChartContainer config={chartConfig} className="mx-auto aspect-square">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="name"
                  label={(entry) => `${entry.percentage}%`}
                  labelLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                />
              </PieChart>
            </ChartContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.map((item) => {
            const configKey = item.sentiment.toLowerCase() as keyof typeof chartConfig;
            const config = chartConfig[configKey];
            
            return (
              <div key={item.sentiment} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getSentimentColor(item.sentiment) }}
                />
                <span className="text-sm">
                  {config?.label || item.sentiment}: {item.count} ({item.percentage}%)
                </span>
              </div>
            );
          })}
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