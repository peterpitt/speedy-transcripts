import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/auth/SignOutButton";

// Shared app header: primary nav + live credits balance pill. Server component —
// reads the signed-in user's balance on every server navigation.
export default async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .single();
    balance = profile ? Number(profile.credits_balance) : null;
  }

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Video Speed Reader
        </Link>

        {user && (
          <nav className="flex items-center gap-4">
            <Link
              href="/app"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Transcriptions
            </Link>
            <Link
              href="/credits"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm transition-colors hover:border-foreground/30"
            >
              <span className="text-muted-foreground">Credits</span>
              <span className="font-semibold text-foreground">
                {balance ?? "—"}
              </span>
              <span className="text-primary">Buy more</span>
            </Link>
            <SignOutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
