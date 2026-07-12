import Link from "next/link";
import NotifyForm from "@/components/NotifyForm";

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-20"
      style={{ background: "var(--bg)" }}>
      <div className="max-w-md w-full">
        <div className="card-ink p-8 text-center">
          <div className="mb-6">
            <span className="stamp text-sm">Coming Soon</span>
          </div>
          <h1 className="text-2xl font-bold mb-3"
            style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>
            Checkout isn&apos;t open yet
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-2)" }}>
            Marrow Library is coming soon. Join the waitlist and we&apos;ll email
            you the moment it launches — waitlist members lock in the $20
            one-time launch price.
          </p>
          <NotifyForm source="success" />
        </div>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-2)" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
