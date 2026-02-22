import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminVideoDetail, getAllIngredients } from "@/lib/admin-actions";
import { VideoEditForm } from "./video-edit-form";
import Link from "next/link";

export default async function VideoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/admin/login");
  if (session.user.role !== "admin") return null;

  const { id } = await params;
  const videoId = parseInt(id, 10);
  if (isNaN(videoId)) notFound();

  const detail = await getAdminVideoDetail(videoId);
  if (!detail) notFound();

  const allIngredients = await getAllIngredients();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {detail.analysis
            ? `Day ${detail.analysis.videoDay}`
            : `Video #${detail.video.id}`}
        </h1>
        {detail.video.tiktokUrl && (
          <a
            href={detail.video.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View on TikTok
          </a>
        )}
      </div>
      <VideoEditForm
        video={detail.video}
        analysis={detail.analysis}
        additions={detail.additions}
        allIngredients={allIngredients}
      />
    </div>
  );
}
