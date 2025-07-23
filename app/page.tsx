import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import StewHeader from '@/app/components/StewHeader';
import RatingChart from '@/app/components/RatingChart';
import PopularIngredients from '@/app/components/PopularIngredients';
import SentimentChart from '@/app/components/SentimentChart';
import MVPIngredients from '@/app/components/MVPIngredients';
import VideoTable from '@/app/components/VideoTable';
import { 
  getCurrentStats, 
  getStewRatings, 
  getPopularIngredients, 
  getMVPIngredients, 
  getSentimentDistribution,
  getLatestVideo,
  getAllVideosAnalysis
} from '@/lib/actions';

export default async function Page() {
  // Fetch all data in parallel
  const [stats, ratings, popularIngredients, mvpIngredients, sentimentData, latestVideo, videosAnalysis] = await Promise.all([
    getCurrentStats(),
    getStewRatings(),
    getPopularIngredients(),
    getMVPIngredients(),
    getSentimentDistribution(),
    getLatestVideo(),
    getAllVideosAnalysis(),
  ]);

  return (
    <TooltipProvider>
      <Sonner />
      <div className="min-h-screen bg-gradient-background">
        <div className="container mx-auto px-4 py-8">
          <StewHeader stats={stats} latestVideo={latestVideo} />
          
          <div className="mb-8">
            <RatingChart ratings={ratings} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <PopularIngredients ingredients={popularIngredients} />
            </div>
            <MVPIngredients ingredients={mvpIngredients} />
          </div>

          <div className="mb-8">
            <VideoTable videos={videosAnalysis} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
