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
      label: 'Overall Rating',
      description: 'Overall taste and satisfaction rating • Colors by sentiment: green (positive), purple (experimental), yellow (neutral), red (negative) • Transparent bars indicate AI-inferred ratings'
    },
    richness: {
      key: 'richness', 
      label: 'Richness',
      description: 'Depth and richness of flavors • Colors by sentiment: green (positive), purple (experimental), yellow (neutral), red (negative) • Transparent bars indicate AI-inferred ratings'
    },
    complexity: {
      key: 'complexity',
      label: 'Complexity', 
      description: 'Complexity and sophistication of taste • Colors by sentiment: green (positive), purple (experimental), yellow (neutral), red (negative) • Transparent bars indicate AI-inferred ratings'
    }
  };

  const getSentimentColor = (sentiment: string, isInferred: boolean = false) => {
    const opacity = isInferred ? 0.4 : 1.0;
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return `hsla(120, 70%, 50%, ${opacity})`; // Green for positive sentiment
      case 'experimental':
        return `hsla(280, 70%, 60%, ${opacity})`; // Purple for experimental sentiment
      case 'neutral':
        return `hsla(45, 90%, 55%, ${opacity})`; // Yellow/amber for neutral sentiment
      case 'negative':
        return `hsla(0, 70%, 50%, ${opacity})`; // Red for negative sentiment
      default:
        return `hsla(210, 10%, 60%, ${opacity})`; // Gray for unknown sentiment
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
      // Store all inferred statuses for tooltip and calculations
      ratingInferred: rating.ratingInferred,
      richnessInferred: rating.richnessInferred,
      complexityInferred: rating.complexityInferred,
      color: getSentimentColor(rating.creatorSentiment, isInferred)
    };
  });

  const currentConfig = ratingConfig[selectedRating];
  
  // Get inferred count for current rating type
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 {currentConfig.label} Evolution
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
          <div className="flex gap-2">
            {(Object.keys(ratingConfig) as RatingType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  trackChartInteraction('rating_chart', 'filter_change', type);
                  setSelectedRating(type);
                }}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  selectedRating === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
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
                formatter={(value: number, name: string, props: { payload?: { isInferred?: boolean; ratingInferred?: boolean; richnessInferred?: boolean; complexityInferred?: boolean } }) => {
                  // Get the appropriate inferred status based on the current rating type
                  let isInferred = false;
                  if (props.payload) {
                    if (name.includes('Overall')) {
                      isInferred = props.payload.ratingInferred || false;
                    } else if (name.includes('Richness')) {
                      isInferred = props.payload.richnessInferred || false;
                    } else if (name.includes('Complexity')) {
                      isInferred = props.payload.complexityInferred || false;
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
                radius={[4, 4, 0, 0]}
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