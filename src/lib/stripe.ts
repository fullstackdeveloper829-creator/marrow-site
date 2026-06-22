import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is required");

export const stripe = new Stripe(key, {
  apiVersion: "2025-02-24.acacia" as const,
});
