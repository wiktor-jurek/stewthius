import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getVideoDetailByDay,
  getDayDeltas,
  getDayIngredients,
  getVideoPercentile,
  getSimilarVideos,
  getGlobalAverages,
} from '@/lib/actions';
import TikTokEmbed from '@/app/components/video/TikTokEmbed';
import DailyDelta from '@/app/components/video/DailyDelta';
import IngredientReceipt from '@/app/components/video/IngredientReceipt';
import VitalSigns from '@/app/components/video/VitalSigns';
import SommelierNotes from '@/app/components/video/SommelierNotes';
import VibeNeighborhood from '@/app/components/video/VibeNeighborhood';
import ViralVsTastyBar from '@/app/components/video/ViralVsTastyBar';

interface VideoPageProps {
  params: Promise<{ day: string }>;
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { day: dayStr } = await params;
  const day = parseInt(dayStr, 10);
  if (isNaN(day)) return { title: 'Not Found — Stewthius' };

  const video = await getVideoDetailByDay(day);
  if (!video) return { title: 'Not Found — Stewthius' };

  return {
    title: `Day ${day} — Stewthius`,
    description: video.keyQuote
      ? `Day ${day} of the perpetual stew: "${video.keyQuote}"`
      : `Day ${day} of the perpetual stew. Rated ${video.ratingOverall}/10. ${video.creatorSentiment}.`,
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { day: dayStr } = await params;
  const day = parseInt(dayStr, 10);
  if (isNaN(day)) notFound();

  const video = await getVideoDetailByDay(day);
  if (!video) notFound();

  const [deltas, ingredients, percentile, similarVideos, globalAverages] = await Promise.all([
    getDayDeltas(day),
    getDayIngredients(day),
    getVideoPercentile(day),
    getSimilarVideos(video.videoId, 3),
    getGlobalAverages(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-primary text-primary-foreground p-8 rounded-xl shadow-warm-lg">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm opacity-80 hover:opacity-100 transition-opacity mb-4"
            >
              ← Back to the Kitchen
            </Link>
            <h1 className="text-4xl font-bold font-serif mb-2">Day {day}</h1>
            <p className="text-sm opacity-80 tracking-wide uppercase mb-1">
              {video.creatorSentiment} · Rated {video.ratingOverall}/10
            </p>
            {video.keyQuote && (
              <blockquote className="text-base italic opacity-90 max-w-lg mx-auto mt-3">
                &ldquo;{video.keyQuote}&rdquo;
              </blockquote>
            )}
          </div>
        </div>

        {/* Stock Ticker */}
        <section>
          <DailyDelta
            deltas={deltas}
            sentiment={video.creatorSentiment}
            ratingInferred={video.ratingInferred}
          />
        </section>

        {/* Two-column: Video Embed + Ingredients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="flex flex-col items-center">
            <TikTokEmbed videoUrl={video.tiktokUrl} videoId={video.videoId} />
          </section>
          <section>
            <IngredientReceipt ingredients={ingredients} day={day} />
          </section>
        </div>

        {/* Vital Signs Radar */}
        <section>
          <VitalSigns video={video} globalAverages={globalAverages} />
        </section>

        {/* Two-column: Sommelier + Viral vs Tasty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SommelierNotes video={video} />
          </section>
          <section>
            <ViralVsTastyBar data={percentile} day={day} />
          </section>
        </div>

        {/* Vibe Neighborhood */}
        <section>
          <VibeNeighborhood similarVideos={similarVideos} />
        </section>

        <footer className="text-center pb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to the Kitchen
          </Link>
        </footer>
      </div>
    </div>
  );
}
