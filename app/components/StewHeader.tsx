'use client';

import { Stats, Video } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { trackExternalLink } from '@/lib/analytics';

interface StewHeaderProps {
  stats: Stats;
  latestVideo: Video | null;
}

const StewHeader = ({ stats, latestVideo }: StewHeaderProps) => {
  return (
    <div className="bg-gradient-primary text-primary-foreground p-8 rounded-lg shadow-warm mb-8">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-4xl font-bold mb-2">stewthius over time</h1>
            <p className="text-lg opacity-90 mb-4">
              Tracking the evolution of the legendary perpetual stew
            </p>
            {latestVideo && (
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={() => {
                    trackExternalLink(latestVideo.tiktokUrl, 'tiktok', `header_latest_video_day_${latestVideo.day}`);
                    window.open(latestVideo.tiktokUrl, '_blank');
                  }}
                  variant="default"
                  className='hover:cursor-pointer'
                  size="lg"
                >
                  <span className="mr-2">🎥</span>
                  Day {latestVideo.day} - Latest Video
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
            <div className="text-3xl font-bold mb-1">{stats.currentDay}</div>
            <div className="text-sm opacity-80">Current Day</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.currentRating}/10</div>
            <div className="text-sm opacity-80">Today&apos;s Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.totalIngredients}</div>
            <div className="text-sm opacity-80">Total Ingredients</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-center opacity-90">
            Welcome to the data-driven analysis of the internet&apos;s most ambitious culinary experiment. 
            Each metric tells the story of community-driven flavor evolution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StewHeader;