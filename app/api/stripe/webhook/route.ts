import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe must reach this route WITHOUT the auth-refresh middleware mangling the
// body (see middleware.ts matcher exclusion) and WITHOUT a cookie session —
// the caller is Stripe, so we use the service-role admin client for all writes.
export async function POST(req: Request) {
  const body = await req.text(); // RAW body — never .json() first (breaks signature)
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return new NextResponse("no signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return new NextResponse("invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, unpaid: true });
  }

  const userId = session.metadata?.user_id;
  const productId = session.metadata?.product_id;
  const credits = Number(session.metadata?.credits);
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!userId || !productId || !credits || !paymentIntentId) {
    console.error("missing required fields", {
      userId,
      productId,
      credits,
      paymentIntentId,
    });
    return new NextResponse("missing metadata", { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Insert the ledger row. The UNIQUE INDEX on stripe_payment_intent_id
  //    (migration Step 4) makes this idempotent against duplicate deliveries.
  const { error: insertErr } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    type: "purchase",
    description: `Purchased ${credits} credits`,
    stripe_payment_intent_id: paymentIntentId,
  });
  if (insertErr) {
    if (insertErr.code === "23505") {
      // unique_violation — we already processed this payment_intent. Idempotent success.
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("insert failed", insertErr);
    return new NextResponse("db insert failed", { status: 500 });
  }

  // 2. Increment the balance (ledger is source of truth; balance is derived).
  const { data: profile } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();
  const newBalance = Number(profile?.credits_balance ?? 0) + credits;
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ credits_balance: newBalance })
    .eq("id", userId);
  if (updateErr) {
    console.error("balance update failed", updateErr);
    return new NextResponse("balance update failed", { status: 500 });
  }

  return NextResponse.json({ received: true, credited: credits });
}
