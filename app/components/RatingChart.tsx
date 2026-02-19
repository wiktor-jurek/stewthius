'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StewRating } from '@/lib/actions';
import { trackChartInteraction } from '@/lib/analytics';

interface RatingChartProps {
  ratings: StewRating[];
}

type RatingType = 'overall' | 'richness' | 'complexity';

const RatingChart = ({ ratings }: RatingChartProps) => {
  const [selectedRating, setSelectedRating] = useState<RatingType>('overall');

  const ratingConfig = {
    overall: {
      key: 'rating',
      label: 'Overall',
      description: 'Overall taste and satisfaction · Colored by sentiment: green (positive), purple (experimental), amber (neutral), red (negative) · Translucent bars = AI-inferred'
    },
    richness: {
      key: 'richness', 
      label: 'Richness',
      description: 'Depth and richness of flavors · Colored by sentiment: green (positive), purple (experimental), amber (neutral), red (negative) · Translucent bars = AI-inferred'
    },
    complexity: {
      key: 'complexity',
      label: 'Complexity', 
      description: 'Complexity and sophistication of taste · Colored by sentiment: green (positive), purple (experimental), amber (neutral), red (negative) · Translucent bars = AI-inferred'
    }
  };

  const getSentimentColor = (sentiment: string, isInferred: boolean = false) => {
    const opacity = isInferred ? 0.4 : 1.0;
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return `rgba(74, 124, 89, ${opacity})`;
      case 'experimental':
        return `rgba(123, 94, 167, ${opacity})`;
      case 'neutral':
        return `rgba(201, 148, 62, ${opacity})`;
      case 'negative':
        return `rgba(188, 71, 73, ${opacity})`;
      default:
        return `rgba(139, 115, 85, ${opacity})`;
    }
  };

  const getInferredStatus = (rating: StewRating, ratingType: RatingType) => {
    switch (ratingType) {
      case 'overall':
        return rating.ratingInferred;
      case 'richness':
        return rating.richnessInferred;
      case 'complexity':
        return rating.complexityInferred;
      default:
        return rating.ratingInferred;
    }
  };

  const chartData = ratings.map(rating => {
    const isInferred = getInferredStatus(rating, selectedRating);
    
    return {
      day: rating.day,
      rating: rating.ratingOverall,
      richness: rating.ratingRichness,
      complexity: rating.ratingComplexity,
      sentiment: rating.creatorSentiment,
      isInferred: isInferred,
      ratingInferred: rating.ratingInferred,
      richnessInferred: rating.richnessInferred,
      complexityInferred: rating.complexityInferred,
      color: getSentimentColor(rating.creatorSentiment, isInferred)
    };
  });

  const currentConfig = ratingConfig[selectedRating];
  
  const getInferredCount = () => {
    switch (selectedRating) {
      case 'overall':
        return ratings.filter(rating => rating.ratingInferred).length;
      case 'richness':
        return ratings.filter(rating => rating.richnessInferred).length;
      case 'complexity':
        return ratings.filter(rating => rating.complexityInferred).length;
      default:
        return 0;
    }
  };
  
  const inferredCount = getInferredCount();
  const totalCount = chartData.length;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              🍲 The Stew&apos;s Journey
            </CardTitle>
            <CardDescription className="mt-2">
              {currentConfig.description}
            </CardDescription>
            {inferredCount > 0 && (
              <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block">
                ⚠️ {inferredCount} of {totalCount} ratings are AI-inferred
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            {(Object.keys(ratingConfig) as RatingType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  trackChartInteraction('rating_chart', 'filter_change', type);
                  setSelectedRating(type);
                }}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
                  selectedRating === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {ratingConfig[type].label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" className="opacity-40" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(217, 119, 47, 0.08)',
                  color: 'var(--card-foreground)',
                }}
                formatter={(value, name, props) => {
                  let isInferred = false;
                  const payload = props?.payload as Record<string, boolean> | undefined;
                  if (payload) {
                    if (String(name).includes('Overall')) {
                      isInferred = payload.ratingInferred || false;
                    } else if (String(name).includes('Richness')) {
                      isInferred = payload.richnessInferred || false;
                    } else if (String(name).includes('Complexity')) {
                      isInferred = payload.complexityInferred || false;
                    }
                  }
                  
                  return [
                    value,
                    `${name}${isInferred ? ' (AI inferred)' : ''}`
                  ];
                }}
              />
              <Bar 
                dataKey={currentConfig.key}
                name={currentConfig.label}
                radius={[6, 6, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RatingChart;
