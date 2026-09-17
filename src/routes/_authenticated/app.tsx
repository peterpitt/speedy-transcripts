import {
  createFileRoute,
  Link,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Video Speed Reader" },
      { name: "description", content: "Your Video Speed Reader dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();
  const { queryClient } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="text-base font-semibold tracking-tight">
            Video Speed Reader
          </Link>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight">
            Hi {user.email}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your dashboard is coming soon. Upload functionality will be added
            in the next milestone.
          </p>
        </div>
      </main>
    </div>
  );
}
