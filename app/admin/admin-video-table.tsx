"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type VideoRow = {
  id: number;
  videoId: string;
  tiktokUrl: string;
  title: string | null;
  author: string | null;
  isAboutStew: boolean | null;
  processingStatus: string;
  createdAt: string;
  analysisId: number | null;
  videoDay: number | null;
  creatorSentiment: string | null;
  ratingOverall: string | null;
};

function sentimentBadgeVariant(sentiment: string | null) {
  if (!sentiment) return "outline" as const;
  switch (sentiment) {
    case "Super Positive":
    case "Positive":
      return "default" as const;
    case "Neutral":
      return "secondary" as const;
    case "Negative":
    case "Super Negative":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "analyzed":
      return "bg-herb-green/10 text-herb-green border-herb-green/20";
    case "failed":
      return "bg-burnt-tomato/10 text-burnt-tomato border-burnt-tomato/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function AdminVideoTable({ videos }: { videos: VideoRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return videos;
    const q = search.toLowerCase();
    return videos.filter(
      (v) =>
        v.title?.toLowerCase().includes(q) ||
        v.videoId.toLowerCase().includes(q) ||
        v.videoDay?.toString().includes(q) ||
        v.author?.toLowerCase().includes(q),
    );
  }, [videos, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by title, video ID, day, or author..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Day
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Rating
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Sentiment
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Stew?
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-sm">
                    <Link
                      href={`/admin/video/${v.id}`}
                      className="text-primary hover:underline font-semibold"
                    >
                      {v.videoDay ?? "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <Link
                      href={`/admin/video/${v.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {v.title || v.videoId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {v.ratingOverall
                      ? Number(v.ratingOverall).toFixed(1)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {v.creatorSentiment ? (
                      <Badge variant={sentimentBadgeVariant(v.creatorSentiment)}>
                        {v.creatorSentiment}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(v.processingStatus)}`}
                    >
                      {v.processingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.isAboutStew === true
                      ? "Yes"
                      : v.isAboutStew === false
                        ? "No"
                        : "-"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No videos found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
