import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = { title: "Dashboard — Video Speed Reader" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-secondary text-muted-foreground",
  downloading: "bg-secondary text-muted-foreground",
  transcribe: "bg-primary/15 text-primary",
  done: "bg-green-500/15 text-green-400",
  insufficient_credits: "bg-red-500/15 text-red-400",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [{ data: profile }, { data: recent }, { count: total }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", user.id)
        .single(),
      supabase
        .from("jobs")
        .select("id, created_at, video_source_url, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const balance = profile ? Number(profile.credits_balance) : 0;
  const rows = recent ?? [];
  const totalJobs = total ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        {/* Greeting */}
        <section className="animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight">Hi {user.email}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Submit a video and get a clean transcript in a few minutes.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Submit a video
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </section>

        {/* Stat cards */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/credits"
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
          >
            <p className="text-sm text-muted-foreground">Credits balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{balance}</p>
            <p className="mt-2 text-sm text-primary">Buy more →</p>
          </Link>
          <Link
            href="/upload"
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
          >
            <p className="text-sm text-muted-foreground">Transcriptions</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{totalJobs}</p>
            <p className="mt-2 text-sm text-primary">View all →</p>
          </Link>
        </section>

        {/* Recent transcripts */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent transcriptions
            </h2>
            <Link
              href="/upload"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See all
            </Link>
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No transcriptions yet.{" "}
              <Link href="/upload" className="text-primary hover:underline">
                Submit your first video
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">URL</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Transcript</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {timeAgo(job.created_at)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {truncate(job.video_source_url, 44)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_BADGE[job.status] ??
                            "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {job.status === "done" ? (
                          <a
                            href={`/api/jobs/${job.id}/transcript`}
                            download={`transcript-${job.id.slice(0, 8)}.txt`}
                            className="font-medium text-primary hover:underline"
                          >
                            .txt
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
