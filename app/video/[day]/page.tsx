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
import IngredientReceipt from '@/app/components/video/IngredientReceipt';
import VitalSigns from '@/app/components/video/VitalSigns';
import SommelierNotes from '@/app/components/video/SommelierNotes';
import VibeNeighborhood from '@/app/components/video/VibeNeighborhood';
import ViralVsTastyBar from '@/app/components/video/ViralVsTastyBar';

interface VideoPageProps {
  params: Promise<{ day: string }>;
}

function getSentimentGradient(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s.includes('super positive')) return 'bg-sentiment-super-positive';
  if (s.includes('positive')) return 'bg-sentiment-positive';
  if (s.includes('super negative')) return 'bg-sentiment-super-negative';
  if (s.includes('negative')) return 'bg-sentiment-negative';
  return 'bg-gradient-primary';
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { day: dayStr } = await params;
  const day = parseInt(dayStr, 10);
  if (isNaN(day)) return { title: 'Not Found - Stewthius' };

  const video = await getVideoDetailByDay(day);
  if (!video) return { title: 'Not Found - Stewthius' };

  return {
    title: `Day ${day} - Stewthius`,
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

  const [deltas, ingredients, previousIngredients, percentile, similarVideos, globalAverages] =
    await Promise.all([
      getDayDeltas(day),
      getDayIngredients(day),
      getDayIngredients(day - 1),
      getVideoPercentile(day),
      getSimilarVideos(video.videoId, 3),
      getGlobalAverages(),
    ]);

  const overall = deltas.find((d) => d.metric === 'Overall');
  const sabotaged = overall && overall.delta !== null && overall.delta <= -2;

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Dynamic Sentiment Header */}
        <div
          className={`relative overflow-hidden ${getSentimentGradient(video.creatorSentiment)} text-white p-6 md:p-8 rounded-xl shadow-warm-lg`}
        >
          <div className="relative z-10 max-w-5xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-white/70 hover:text-white transition-colors mb-6"
            >
              ← Back to the Kitchen
            </Link>

            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">
                  Day {day}
                </h1>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/25">
                    {video.creatorSentiment}
                  </span>
                  {video.ratingInferred && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 backdrop-blur-sm border border-white/20">
                      🧠 AI Inferred
                    </span>
                  )}
                  {sabotaged && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/30 backdrop-blur-sm border border-red-200/30 animate-pulse">
                      ⚠️ Sabotaged
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-5xl md:text-6xl font-bold font-serif leading-none">
                  {video.ratingOverall}
                </div>
                <div className="text-sm font-medium text-white/60 mt-1 tracking-wider">/10</div>
              </div>
            </div>

            {video.keyQuote && (
              <blockquote className="mt-6 py-3 px-4 rounded-lg bg-white/10 backdrop-blur-sm border-l-4 border-white/40">
                <p className="text-sm md:text-base font-serif italic text-white/90 leading-relaxed">
                  &ldquo;{video.keyQuote}&rdquo;
                </p>
              </blockquote>
            )}
          </div>
        </div>

        {/* Two-column: TikTok (sticky left) + Analytics (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          <div className="lg:col-span-5 lg:sticky lg:top-8 lg:self-start flex flex-col items-center">
            <TikTokEmbed videoUrl={video.tiktokUrl} videoId={video.videoId} />
          </div>

          <div className="lg:col-span-7 space-y-8">
            <IngredientReceipt
              ingredients={ingredients}
              day={day}
              previousIngredients={previousIngredients}
            />
            <VitalSigns video={video} globalAverages={globalAverages} deltas={deltas} />
            <SommelierNotes video={video} />
            <ViralVsTastyBar data={percentile} day={day} />
            <VibeNeighborhood similarVideos={similarVideos} />
          </div>
        </div>

        <footer className="text-center py-8 mt-4">
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
