import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import StewHeader from '@/app/components/StewHeader';
import BrothLine from '@/app/components/BrothLine';
import TopographyOfTaste from '@/app/components/TopographyOfTaste';
import IngredientBubbles from '@/app/components/IngredientBubbles';
import IngredientImpactRankings from '@/app/components/IngredientImpactRankings';
import VideoTable from '@/app/components/VideoTable';
import {
  getCurrentStats,
  getStewRatings,
  getPopularIngredients,
  getMVPIngredients,
  getIngredientImpactRankings,
  getLatestVideo,
  getAllVideosAnalysis,
  getVideoEmbeddingPositions,
} from '@/lib/actions';

export default async function Page() {
  const [stats, ratings, popularIngredients, mvpIngredients, impactRankings, latestVideo, videosAnalysis, embeddingPositions] = await Promise.all([
    getCurrentStats(),
    getStewRatings(),
    getPopularIngredients(),
    getMVPIngredients(),
    getIngredientImpactRankings(),
    getLatestVideo(),
    getAllVideosAnalysis(),
    getVideoEmbeddingPositions(),
  ]);

  return (
    <TooltipProvider>
      <Sonner />
      <div className="min-h-screen bg-gradient-background">
        <div className="container mx-auto px-4 py-8 space-y-16">
          <StewHeader stats={stats} latestVideo={latestVideo} />

          <section>
            <BrothLine ratings={ratings} videos={videosAnalysis} />
          </section>

          <section>
            <TopographyOfTaste videos={videosAnalysis} positions={embeddingPositions} />
          </section>

          <section>
            <IngredientBubbles popular={popularIngredients} mvp={mvpIngredients} />
            <IngredientImpactRankings rankings={impactRankings} />
          </section>

          <section>
            <VideoTable videos={videosAnalysis} />
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}
