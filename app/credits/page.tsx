import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import BuyButton from "@/components/credits/BuyButton";

export const metadata: Metadata = { title: "Credits — Video Speed Reader" };

const TYPE_STYLE: Record<string, string> = {
  purchase: "text-green-400",
  signup_bonus: "text-yellow-400",
  deduction: "text-muted-foreground",
  admin_grant: "text-primary",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [{ data: profile }, { data: products }, { data: transactions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", user.id)
        .single(),
      supabase
        .from("credit_products")
        .select("id, name, credits, price_usd, stripe_price_id")
        .eq("active", true)
        .order("price_usd"),
      supabase
        .from("credit_transactions")
        .select("id, amount, type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const balance = profile ? Number(profile.credits_balance) : 0;
  const tiers = products ?? [];
  const history = transactions ?? [];

  // Baseline = cheapest $/credit tier, used to compute each tier's bonus %.
  const baselineUsdPerCredit = tiers.length
    ? Math.min(...tiers.map((t) => Number(t.price_usd) / Number(t.credits)))
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        {/* Balance */}
        <section className="animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
          <div className="mt-4 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Current balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{balance}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              1 credit = 1 minute of video
            </p>
          </div>
        </section>

        {/* Tiers */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Buy more credits</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {tiers.map((tier) => {
              const usdPerCredit = Number(tier.price_usd) / Number(tier.credits);
              const bonusPct =
                baselineUsdPerCredit > 0
                  ? Math.round((1 - usdPerCredit / baselineUsdPerCredit) * 100)
                  : 0;
              return (
                <div
                  key={tier.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{tier.name}</h3>
                    {bonusPct > 0 && (
                      <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                        +{bonusPct}%
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    ${Number(tier.price_usd).toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Number(tier.credits)} credits · $
                    {usdPerCredit.toFixed(3)}/credit
                  </p>
                  <div className="flex-1" />
                  <BuyButton productId={tier.id} />
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Transaction history
          </h2>
          {history.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => {
                    const amt = Number(tx.amount);
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {fmtDate(tx.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              TYPE_STYLE[tx.type] ?? "text-foreground"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {tx.description ?? "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${
                            amt < 0 ? "text-muted-foreground" : "text-green-400"
                          }`}
                        >
                          {amt > 0 ? `+${amt}` : amt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
