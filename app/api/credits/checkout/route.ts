import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  // 1. Require an authenticated user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Read product_id from the body.
  const body = (await req.json().catch(() => ({}))) as { product_id?: string };
  if (!body.product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  // 3. Look up the product — must be active and have a Stripe price linked.
  const { data: product, error: prodErr } = await supabase
    .from("credit_products")
    .select("id, credits, stripe_price_id, active")
    .eq("id", body.product_id)
    .eq("active", true)
    .single();
  if (prodErr || !product || !product.stripe_price_id) {
    return NextResponse.json(
      { error: "product not found or not purchasable" },
      { status: 400 },
    );
  }

  // 4. Build return URLs from the request origin so this works on the current
  //    Vercel URL today and on the custom domain (M3) without code changes.
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(req.url).origin;

  // 5. Create the Checkout Session.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: product.stripe_price_id, quantity: 1 }],
    success_url: `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/credits`,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      product_id: product.id,
      credits: String(product.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}
