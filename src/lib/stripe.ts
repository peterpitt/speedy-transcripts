import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

// Pinned API version: Stripe ships breaking changes behind this pin, so a
// future SDK bump won't silently change behaviour. Cast keeps us decoupled
// from whatever literal the installed SDK's types expect.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia" as Stripe.LatestApiVersion,
});
