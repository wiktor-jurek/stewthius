import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import type { SimilarVideo } from '@/lib/actions';

interface VibeNeighborhoodProps {
  similarVideos: SimilarVideo[];
}

export default function VibeNeighborhood({ similarVideos }: VibeNeighborhoodProps) {
  if (similarVideos.length === 0) return null;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧬 The Vibe Neighborhood
        </CardTitle>
        <CardDescription>
          Days with the most mathematically similar &ldquo;vibe&rdquo; — found via vector embeddings, not calendar order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {similarVideos.map((sv) => {
            const pct = Math.round(sv.similarity * 100);
            return (
              <Link
                key={sv.videoId}
                href={`/video/${sv.day}`}
                className="group flex items-center gap-4 p-4 rounded-xl bg-background/60 border border-border/30 hover:border-broth-amber/40 transition-all hover:shadow-warm"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-broth-amber/10 flex items-center justify-center">
                  <span className="text-lg font-bold font-serif text-broth-amber">
                    {sv.day}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm group-hover:text-broth-amber transition-colors">
                    Day {sv.day}
                  </div>
                  {sv.title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {sv.title}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-herb-green">
                    {pct}%
                  </div>
                  <div className="text-xs text-muted-foreground">similar</div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
