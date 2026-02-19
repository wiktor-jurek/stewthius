'use client';

import { Stats, Video } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { trackExternalLink } from '@/lib/analytics';

interface StewHeaderProps {
  stats: Stats;
  latestVideo: Video | null;
}

const SteamSVG = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    viewBox="0 0 800 400"
    fill="none"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <path
      d="M120,400 C120,365 145,340 120,310 C95,280 145,255 120,225 C95,195 145,170 120,140 C95,110 145,85 120,55"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.07"
    />
    <path
      d="M250,400 C250,358 280,328 250,298 C220,268 280,238 250,208 C220,178 280,148 250,118 C220,88 280,58 250,28"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.05"
    />
    <path
      d="M400,400 C400,362 425,335 400,308 C375,281 425,254 400,227 C375,200 425,173 400,146 C375,119 425,92 400,65"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.08"
    />
    <path
      d="M540,400 C540,370 560,345 540,320 C520,295 560,270 540,245 C520,220 560,195 540,170 C520,145 560,120 540,95"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.06"
    />
    <path
      d="M680,400 C680,360 705,330 680,300 C655,270 705,240 680,210 C655,180 705,150 680,120 C655,90 705,60 680,30"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.07"
    />
    <path
      d="M180,400 C180,375 195,355 180,335 C165,315 195,295 180,275 C165,255 195,235 180,215"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.04"
    />
    <path
      d="M620,400 C620,380 635,360 620,340 C605,320 635,300 620,280 C605,260 635,240 620,220"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.05"
    />
  </svg>
);

const StewHeader = ({ stats, latestVideo }: StewHeaderProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-primary text-primary-foreground p-8 rounded-xl shadow-warm-lg mb-8">
      <SteamSVG />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="Stewthius Logo"
              width={120}
              height={120}
              className="rounded-full"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-serif mb-3">stewthius over time</h1>
            <p className="text-lg opacity-90 mb-4 max-w-lg mx-auto">
              {stats.currentDay} days. {stats.totalIngredients} ingredients. One legendary pot.{' '}
              <span className="font-semibold">Here&apos;s what&apos;s cooking.</span>
            </p>
            {latestVideo && (
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={() => {
                    trackExternalLink(latestVideo.tiktokUrl, 'tiktok', `header_latest_video_day_${latestVideo.day}`);
                    window.open(latestVideo.tiktokUrl, '_blank');
                  }}
                  variant="secondary"
                  className='hover:cursor-pointer bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm'
                  size="lg"
                >
                  <span className="mr-1">🎥</span>
                  Day {latestVideo.day} — Latest Video
                </Button>
                <blockquote className="text-sm italic opacity-80 text-center max-w-md">
                  {latestVideo.keyQuote ? (
                    <>&ldquo;{latestVideo.keyQuote}&rdquo;</>
                  ) : (
                    <>&ldquo;What started as a simple stew has become a living experiment in crowdsourced cuisine&rdquo;</>
                  )}
                </blockquote>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold font-serif mb-1">{stats.currentDay}</div>
            <div className="text-sm opacity-80">Days Simmering</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-serif mb-1">{stats.currentRating}/10</div>
            <div className="text-sm opacity-80">Today&apos;s Taste</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-serif mb-1">{stats.totalIngredients}</div>
            <div className="text-sm opacity-80">Ingredients Added</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-center opacity-90">
            Welcome to the communal kitchen. Every metric below tells the story of
            community-driven flavor evolution — rustic analytics for a rustic dish.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StewHeader;
