import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminVideos } from "@/lib/admin-actions";
import { AdminVideoTable } from "./admin-video-table";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user.role !== "admin") {
    return null;
  }

  const videos = await getAdminVideos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Videos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {videos.length} videos total
        </p>
      </div>
      <AdminVideoTable videos={videos} />
    </div>
  );
}
