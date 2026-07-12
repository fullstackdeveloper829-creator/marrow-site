import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Checkout is not open yet — Marrow Library is coming soon. Any stale
// checkout link (bookmarks, cached pages) lands on the waitlist instead.
export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(new URL("/#pricing", req.url), 302);
}
