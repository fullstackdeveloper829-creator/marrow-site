import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resend } from "@/lib/resend";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(100).optional().default(""),
  source: z.string().max(40).optional().default("site"),
});

const OWNER_EMAIL = process.env.NOTIFY_TO_EMAIL ?? "fullstackdeveloper829@gmail.com";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const { email, name, source } = parsed.data;

  // Always log first — Vercel function logs act as a backup record of every
  // signup even when email delivery is unconfigured or failing.
  console.log("[notify] signup:", email, name || "—", source);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey !== "re_placeholder") {
    try {
      await resend.emails.send({
        from: "Marrow Waitlist <onboarding@resend.dev>",
        to: OWNER_EMAIL,
        subject: `Waitlist signup: ${email}`,
        text: [
          `Email: ${email}`,
          `Name: ${name || "—"}`,
          `Source: ${source}`,
          `At: ${new Date().toISOString()}`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("[notify] owner email failed:", err);
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (audienceId) {
      try {
        await resend.contacts.create({
          email,
          firstName: name || undefined,
          audienceId,
        });
      } catch (err) {
        console.error("[notify] audience add failed:", err);
      }
    }
  }

  // Visitors never see owner-side plumbing failures — the signup is logged.
  return NextResponse.json({ ok: true });
}
