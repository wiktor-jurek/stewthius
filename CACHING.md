# Data Caching Implementation

This project implements server-side caching to reduce database load and improve performance. Since the data updates daily at best, we cache all database queries for 24 hours.

## How it Works

### Cache Configuration
- **Duration**: 24 hours (86400 seconds)
- **Method**: Next.js `unstable_cache` API
- **Automatic Revalidation**: Data refreshes automatically after 24 hours
- **Manual Invalidation**: API endpoint available for immediate cache clearing

### Cached Functions
All data fetching functions in `lib/actions.ts` are cached:

- `getStewRatings()` - Stew ratings over time
- `getCurrentStats()` - Current day and rating stats
- `getPopularIngredients()` - Most frequently used ingredients
- `getMVPIngredients()` - Ingredients with highest positive impact
- `getSentimentDistribution()` - Creator sentiment analysis
- `getLatestVideo()` - Most recent video data
- `getAllVideosAnalysis()` - Complete video analysis data

### Cache Tags
Each function uses specific cache tags for selective invalidation:

- `stew-data` - Global tag for all stew-related data
- `ratings` - Rating-specific data
- `stats` - Statistics data
- `ingredients` - Ingredient-related data
- `sentiment` - Sentiment analysis data
- `videos` - Video data

## Manual Cache Invalidation

### Using the API Endpoint

You can manually clear the cache by calling the revalidation API:

```bash
# Clear all cache
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'

# Clear specific data type
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "ingredients"}'
```

Available types: `ratings`, `stats`, `ingredients`, `sentiment`, `videos`, `all`

### Using Cache Utility Functions

Import and use the cache management functions:

```typescript
import { invalidateAllStewData, invalidateByDataType } from '@/lib/cache';

// Clear all cache
await invalidateAllStewData();

// Clear specific data type
await invalidateByDataType('ingredients');
```

## Authorization (Optional)

To secure the revalidation endpoint, set the `REVALIDATE_TOKEN` environment variable:

```env
REVALIDATE_TOKEN=your-secret-token-here
```

Then include it in API calls:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{"type": "all"}'
```

## Performance Benefits

- **Reduced Database Load**: Queries only run when cache expires or is invalidated
- **Faster Page Loads**: Cached data serves immediately without database round trips
- **Better User Experience**: Consistent fast response times
- **Cost Savings**: Fewer database connections and query executions

## When to Invalidate Cache

Consider invalidating the cache when:
- New video analysis is added to the database
- Ingredient data is updated
- Ratings are modified
- Any time fresh data needs to be reflected immediately

The cache will automatically refresh after 24 hours, so manual invalidation is only needed for immediate updates. 