import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type BillingCycle = "monthly" | "annual" | "lifetime" | "launch";
type CheckoutTier = "COLLECTOR" | "CURATOR" | "COLLECTOR_LIFETIME";

interface PriceConfig {
  unitAmount: number;
  currency: string;
  recurring: { interval: "month" | "year" } | null;
  productName: string;
  mode: "subscription" | "payment";
}

function getPriceConfig(tier: CheckoutTier, billing: BillingCycle): PriceConfig | null {
  if (billing === "launch") {
    return {
      unitAmount: 2000,
      currency: "usd",
      recurring: null,
      productName: "Marrow Library — Full Access (3 Months)",
      mode: "payment",
    };
  }

  if (billing === "lifetime" || tier === "COLLECTOR_LIFETIME") {
    return {
      unitAmount: 7900,
      currency: "usd",
      recurring: null,
      productName: "Marrow Library Collector — Lifetime",
      mode: "payment",
    };
  }

  if (tier === "COLLECTOR" && billing === "monthly") {
    return {
      unitAmount: 599,
      currency: "usd",
      recurring: { interval: "month" },
      productName: "Marrow Library Collector — Monthly",
      mode: "subscription",
    };
  }

  if (tier === "COLLECTOR" && billing === "annual") {
    return {
      unitAmount: 4900,
      currency: "usd",
      recurring: { interval: "year" },
      productName: "Marrow Library Collector — Annual",
      mode: "subscription",
    };
  }

  if (tier === "CURATOR" && billing === "monthly") {
    return {
      unitAmount: 1499,
      currency: "usd",
      recurring: { interval: "month" },
      productName: "Marrow Library Curator — Monthly",
      mode: "subscription",
    };
  }

  if (tier === "CURATOR" && billing === "annual") {
    return {
      unitAmount: 9900,
      currency: "usd",
      recurring: { interval: "year" },
      productName: "Marrow Library Curator — Annual",
      mode: "subscription",
    };
  }

  return null;
}

// GET is explicitly disallowed — checkout sessions must be initiated via POST
// to prevent CSRF via navigation pre-fetch, <img src>, or search engine crawlers.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed. Send a POST request with { tier, billing } to create a checkout session." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";
  let rawTier: string | null = null;
  let rawBilling: string | null = null;

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    rawTier    = form.get("tier")    as string | null;
    rawBilling = form.get("billing") as string | null;
  } else {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    rawTier    = typeof body["tier"]    === "string" ? body["tier"]    : null;
    rawBilling = typeof body["billing"] === "string" ? body["billing"] : null;
  }

  rawBilling ??= "annual";

  const validTiers: CheckoutTier[]   = ["COLLECTOR", "CURATOR", "COLLECTOR_LIFETIME"];
  const validBilling: BillingCycle[] = ["monthly", "annual", "lifetime", "launch"];

  if (!rawTier || !validTiers.includes(rawTier as CheckoutTier)) {
    return NextResponse.json({ error: "Invalid or missing tier parameter" }, { status: 400 });
  }

  if (!validBilling.includes(rawBilling as BillingCycle)) {
    return NextResponse.json({ error: "Invalid billing parameter" }, { status: 400 });
  }

  const tier    = rawTier    as CheckoutTier;
  const billing = rawBilling as BillingCycle;
  const priceConfig = getPriceConfig(tier, billing);

  if (!priceConfig) {
    return NextResponse.json(
      { error: "No price found for this tier/billing combination" },
      { status: 400 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marrow-site.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: priceConfig.mode,
    line_items: [
      {
        price_data: {
          currency: priceConfig.currency,
          unit_amount: priceConfig.unitAmount,
          product_data: { name: priceConfig.productName },
          ...(priceConfig.recurring !== null
            ? { recurring: priceConfig.recurring }
            : {}),
        },
        quantity: 1,
      },
    ],
    metadata: { tier, billing },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/#pricing`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.redirect(session.url, 303);
}
