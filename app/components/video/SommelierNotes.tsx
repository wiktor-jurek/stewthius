import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { VideoDetail } from '@/lib/actions';

interface SommelierNotesProps {
  video: VideoDetail;
}

export default function SommelierNotes({ video }: SommelierNotesProps) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🍷 The AI Sommelier
        </CardTitle>
        <CardDescription>
          When you let a language model taste-test perpetual soup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {video.keyQuote && (
          <blockquote className="border-l-4 border-broth-amber pl-4 py-2 bg-broth-amber/5 rounded-r-lg">
            <p className="text-base italic font-serif text-foreground/90">
              &ldquo;{video.keyQuote}&rdquo;
            </p>
            <footer className="text-xs text-muted-foreground mt-2">
              — Day {video.day} Transcript
            </footer>
          </blockquote>
        )}

        {video.flavorProfileNotes && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <span>🫗</span> Tasting Notes
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {video.flavorProfileNotes}
            </p>
          </div>
        )}

        {video.generalNotes && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <span>📋</span> General Notes
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {video.generalNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
