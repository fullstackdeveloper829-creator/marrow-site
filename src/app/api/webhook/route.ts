import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { transporter, FROM } from "@/lib/mailer";
import { GITHUB_REPO, FALLBACK_RELEASE } from "@/lib/constants";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// ── Email HTML ────────────────────────────────────────────────────────────────

function emailHtml(email: string, siteUrl: string): string {
  const name = email.split("@")[0] ?? "there";
  const ghBase = `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Welcome to Marrow Library Pro</title>
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e4e4e7;">
<div style="display:none;max-height:0;overflow:hidden;">Your Marrow Library Pro purchase is confirmed — activate instantly with your email.&#8203;&zwj;&#65279;</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06061a;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

  <!-- Logo -->
  <tr><td style="padding-bottom:32px;">
    <span style="background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:8px 14px;font-size:15px;font-weight:800;color:#fff;">&#9670; Marrow Library</span>
  </td></tr>

  <!-- Hero card -->
  <tr><td style="background:#0d0d20;border:1px solid #1e1e35;border-radius:16px;padding:40px 36px 36px;">

    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#818cf8;text-transform:uppercase;letter-spacing:.1em;">&#9733; Pro License &mdash; $20 one-time</p>
    <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">You&rsquo;re in, ${name}!</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#71717a;line-height:1.6;">
      Thanks for purchasing Marrow Library Pro. Activation is instant &mdash; just enter
      <strong style="color:#c7d2fe;">${email}</strong> inside the app.
    </p>

    <!-- Activation steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a18;border:1px solid #2a2a45;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr><td>
        <p style="margin:0 0 16px;font-size:10px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:.12em;">How to activate</p>
        ${[
          ["1", "Open Marrow Library", "Launch the desktop app on your Mac or PC"],
          ["2", "Click the license badge", "Top-right corner of the app header"],
          ["3", "Enter your email", `Type <strong style="color:#c7d2fe;">${email}</strong> and click Activate Pro`],
          ["4", "All features unlock instantly", "No key, no code, no waiting"],
        ].map(([n, t, d]) => `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
          <tr>
            <td valign="top" style="width:28px;padding-right:12px;padding-top:2px;">
              <div style="width:22px;height:22px;background:rgba(99,102,241,.2);border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#818cf8;">${n}</div>
            </td>
            <td>
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e4e4e7;">${t}</p>
              <p style="margin:0;font-size:13px;color:#52525b;line-height:1.5;">${d}</p>
            </td>
          </tr>
        </table>`).join("")}
      </td></tr>
    </table>

    <!-- Download buttons — direct GitHub links, no license key in URL -->
    <p style="margin:0 0 12px;font-size:10px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:.12em;">Download</p>
    ${[
      { url: `${ghBase}/MarrowLibrary-${FALLBACK_RELEASE}-macos-universal.dmg`,    icon: "🍏", label: "macOS",          ext: ".dmg" },
      { url: `${ghBase}/MarrowLibrary-${FALLBACK_RELEASE}-windows-setup.exe`,      icon: "🪟", label: "Windows",         ext: ".exe" },
      { url: `${ghBase}/MarrowScanner-${FALLBACK_RELEASE}-android.apk`,            icon: "🤖", label: "Android Scanner", ext: ".apk" },
    ].map(p => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
      <tr>
        <td style="background:rgba(79,70,229,.12);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:0;">
          <a href="${p.url}" style="display:block;padding:14px 18px;text-decoration:none;color:#d4d4d8;font-size:14px;font-weight:600;">
            ${p.icon}&nbsp;&nbsp;Download for ${p.label} <span style="color:#52525b;font-weight:400;font-size:12px;">${p.ext}</span>
          </a>
        </td>
      </tr>
    </table>`).join("")}

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:#3f3f55;">Questions? Reply to this email &mdash; we read everything.</p>
    <p style="margin:0;font-size:12px;color:#27273a;">&copy; 2026 Marrow Library &nbsp;&middot;&nbsp;
      <a href="${siteUrl}/privacy" style="color:#3f3f55;text-decoration:none;">Privacy</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function emailText(email: string, siteUrl: string): string {
  const ghBase = `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}`;
  return [
    "Marrow Library Pro — Purchase Confirmed",
    "",
    "Thanks for your purchase! Activation takes 10 seconds:",
    "",
    "1. Open Marrow Library on your Mac or PC",
    "2. Click the license badge (top-right header)",
    `3. Enter this email: ${email}`,
    "4. Click Activate Pro — done!",
    "",
    "Download links:",
    `macOS:   ${ghBase}/MarrowLibrary-${FALLBACK_RELEASE}-macos-universal.dmg`,
    `Windows: ${ghBase}/MarrowLibrary-${FALLBACK_RELEASE}-windows-setup.exe`,
    `Android: ${ghBase}/MarrowScanner-${FALLBACK_RELEASE}-android.apk`,
    "",
    "Questions? Reply to this email.",
    `© 2026 Marrow Library · ${siteUrl}`,
  ].join("\n");
}

// ── Webhook handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook verification failed: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "not_paid" });
    }

    // Dedup: skip if we already sent an email for this session.
    if (session.metadata?.emailSent === "true") {
      return NextResponse.json({ received: true, skipped: "email_already_sent" });
    }

    const email =
      session.customer_details?.email ??
      session.customer_email ??
      null;

    if (!email) {
      console.error("[webhook] No email found in session", session.id);
      return NextResponse.json({ received: true, skipped: "no_email" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marrowlibrary.app";

    try {
      await transporter.sendMail({
        from: `Marrow Library <${FROM}>`,
        to: email,
        subject: "Welcome to Marrow Library Pro 🎉 — activate in 10 seconds",
        html: emailHtml(email, siteUrl),
        text: emailText(email, siteUrl),
      });
      console.log("[webhook] Purchase email sent to", email);

      // Mark this session so duplicate webhook deliveries don't resend.
      await stripe.checkout.sessions.update(session.id, {
        metadata: { ...(session.metadata ?? {}), emailSent: "true" },
      });
    } catch (err) {
      console.error("[webhook] SMTP error:", err);
    }
  }

  return NextResponse.json({ received: true });
}
