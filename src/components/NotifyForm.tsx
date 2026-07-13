"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "done" | "error";

export default function NotifyForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p
        className="text-center text-sm font-semibold rounded-xl px-4 py-4"
        style={{
          color: "var(--moss)",
          background: "rgba(63,107,79,0.08)",
          border: "1.5px solid var(--moss)",
        }}
      >
        ✓ You&apos;re on the list — we&apos;ll email you at launch.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="w-full px-4 py-3 rounded-lg text-sm outline-none"
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border-2)",
          color: "var(--text-1)",
        }}
      />
      {state === "error" && (
        <p
          className="text-sm px-4 py-3 rounded-lg"
          style={{
            color: "var(--indigo-light)",
            background: "var(--indigo-subtle)",
            border: "1px solid var(--indigo)",
          }}
        >
          Something went wrong — please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={state === "loading"}
        className="btn-accent w-full px-6 py-3.5 text-sm disabled:opacity-60"
      >
        {state === "loading" ? "Adding you…" : "Notify me when it launches →"}
      </button>
      <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
        No spam. One email when Marrow launches.
      </p>
    </form>
  );
}
