import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import AutoRefresh from "@/components/credits/AutoRefresh";

export const metadata: Metadata = { title: "Payment complete — Video Speed Reader" };

// UX-only landing page. It does NOT credit — the Stripe webhook is the single
// source of truth for crediting. This page just reflects the balance and
// refreshes once to cover the brief webhook-delivery delay.
export default async function CreditsSuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();
  const balance = profile ? Number(profile.credits_balance) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <AutoRefresh />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-20 text-center">
        <div className="rounded-2xl border border-border bg-card p-10">
          <h1 className="text-2xl font-bold tracking-tight">Payment complete</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Thanks! Your credits are being added. Your balance will update here
            within a few seconds.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">Current balance</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">{balance}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/credits"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              View credits
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Transcribe a video
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
