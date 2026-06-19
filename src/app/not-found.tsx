export default function NotFound() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#02020c", padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: "50%", marginBottom: 24,
            background: "rgba(91,82,240,0.1)", border: "1px solid rgba(91,82,240,0.25)",
          }}>
            <span style={{ fontSize: 28 }}>🔍</span>
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-.04em" }}>
            Page not found
          </h1>
          <p style={{ color: "#7070a0", fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            That URL doesn&apos;t exist. Here are the pages you might be looking for:
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
          {[
            { href: "/", icon: "🏠", label: "Home", sub: "Back to the landing page" },
            { href: "/download", icon: "⬇️", label: "Download", sub: "Free trial + all platforms" },
            { href: "/#pricing", icon: "💳", label: "Pricing", sub: "$20 once, no subscription" },
            { href: "/#features", icon: "✨", label: "Features", sub: "Everything Marrow can do" },
          ].map(({ href, icon, label, sub }) => (
            <a key={href} href={href} style={{
              display: "block", padding: "18px 20px", borderRadius: 14, textDecoration: "none",
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              transition: "border-color .2s, background .2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(91,82,240,0.35)";
                (e.currentTarget as HTMLElement).style.background = "rgba(91,82,240,0.05)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e0f0", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#505078", lineHeight: 1.4 }}>{sub}</div>
            </a>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#404068" }}>
          Still lost?{" "}
          <a href="mailto:support@marrowlibrary.app"
            style={{ color: "#818cf8", textDecoration: "underline", textUnderlineOffset: 2 }}>
            Email support@marrowlibrary.app
          </a>
        </p>
      </div>
    </main>
  );
}
