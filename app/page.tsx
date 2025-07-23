import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import StewHeader from '@/app/components/StewHeader';
import RatingChart from '@/app/components/RatingChart';
import PopularIngredients from '@/app/components/PopularIngredients';
import SentimentChart from '@/app/components/SentimentChart';
import MVPIngredients from '@/app/components/MVPIngredients';
import { 
  getCurrentStats, 
  getStewRatings, 
  getPopularIngredients, 
  getMVPIngredients, 
  getSentimentDistribution 
} from '@/lib/actions';

export default async function Page() {
  // Fetch all data in parallel
  const [stats, ratings, popularIngredients, mvpIngredients, sentimentData] = await Promise.all([
    getCurrentStats(),
    getStewRatings(),
    getPopularIngredients(),
    getMVPIngredients(),
    getSentimentDistribution(),
  ]);

  return (
    <TooltipProvider>
      <Sonner />
      <div className="min-h-screen bg-gradient-background">
        <div className="container mx-auto px-4 py-8">
          <StewHeader stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RatingChart ratings={ratings} />
            <PopularIngredients ingredients={popularIngredients} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SentimentChart data={sentimentData} />
            <MVPIngredients ingredients={mvpIngredients} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
