export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF6EE" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", fontWeight: 700, color: "#1C1812", margin: "0 0 1rem", fontFamily: "Fraunces, Georgia, serif" }}>404</h1>
        <p style={{ color: "#57503F", marginBottom: "2rem" }}>Page not found.</p>
        <a href="/" style={{ color: "#C24B24", textDecoration: "underline" }}>← Back to home</a>
      </div>
    </main>
  );
}
