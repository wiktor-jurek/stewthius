import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return <>{children}</>;
  }

  if (session.user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don&apos;t have admin privileges.
          </p>
          <form
            action={async () => {
              "use server";
              const { auth } = await import("@/lib/auth");
              const h = await headers();
              await auth.api.signOut({ headers: h });
              redirect("/admin/login");
            }}
          >
            <button
              type="submit"
              className="text-primary underline hover:text-primary/80"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="font-serif font-bold text-lg text-foreground"
              >
                Stewthius Admin
              </Link>
              <Link
                href="/admin/ingredients"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ingredients
              </Link>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View Site
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  const { auth } = await import("@/lib/auth");
                  const h = await headers();
                  await auth.api.signOut({ headers: h });
                  redirect("/admin/login");
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
