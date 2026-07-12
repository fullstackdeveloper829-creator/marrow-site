import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Checkout is not open yet — Marrow Library is coming soon.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      comingSoon: true,
      error:
        "Checkout is not open yet — Marrow Library is coming soon. Join the waitlist on the homepage to be notified at launch.",
    },
    { status: 503 }
  );
}
