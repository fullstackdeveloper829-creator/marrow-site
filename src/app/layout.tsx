import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const SITE_URL = "https://marrow-site.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Marrow Library — Catalog Your Collection",
    template: "%s | Marrow Library",
  },
  description:
    "Scan barcodes, track live eBay values, catalog books, vinyl, games, movies & more. One-time $20, no subscription. Local-first. Mac, Windows, Android & iOS.",
  keywords: [
    // Core global
    "collection cataloging app",
    "collection cataloguing app",
    "physical collection manager",
    "personal collection database",
    "barcode scanner collection app",
    "offline collection tracker",
    "local-first collection software",
    "best collection app 2026",
    "collection management software",
    // Books
    "home library cataloging app",
    "book collection tracker app",
    "personal library software",
    "book inventory app",
    "home library organizer",
    "book catalogue app",
    // Vinyl / Music
    "vinyl record collection app",
    "vinyl record cataloger",
    "CD collection cataloging software",
    "record collection tracker",
    "vinyl catalogue app",
    "music collection manager",
    // Games
    "video game collection tracker",
    "video game collection manager",
    "board game cataloging app",
    "retro game collection software",
    "gaming collection organizer",
    // Movies
    "DVD Blu-ray collection app",
    "physical media collection manager",
    "movie collection database",
    "movie collection app",
    "blu ray cataloging app",
    // Comics / Cards
    "comic book collection software",
    "sports card collection tracker",
    "trading card collection app",
    // Value / Pricing
    "collection valuation app",
    "eBay price tracker collection",
    "no subscription collection app",
    "buy once collection manager",
    "lifetime license collection software",
    "collection app no monthly fee",
    "one time purchase collection app",
    // Competitors
    "CLZ alternative",
    "Libib alternative",
    "iCollect Everything alternative",
    "Collectorz alternative",
    // UK
    "collection cataloguing software",
    "physical media catalogue software",
    "organise your collection app",
    "car boot sale collection tracker",
    "charity shop finds tracker",
    "car boot finds app",
    // US
    "thrift store finds tracker",
    "garage sale collection app",
    // Australia / Canada
    "op shop finds tracker",
    "collection app Australia",
    "collection app Canada",
    // Global
    "collection app Mac",
    "collection app Windows",
    "collection app Android",
    "collection tracker iOS",
  ],
  authors: [{ name: "Marrow Library", url: SITE_URL }],
  creator: "Marrow Library",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "en_AU", "en_CA", "en_IN", "en_SG", "en_NZ", "en_IE", "en_ZA"],
    url: SITE_URL,
    siteName: "Marrow Library",
    title: "Marrow Library — Catalog Your Collection",
    description:
      "Scan barcodes, track live eBay values, catalog books, vinyl, games & more. One-time $20, no subscription. Local-first. Mac, Windows, Android & iOS.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Marrow Library — Collection Cataloging App" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marrow Library — #1 Collection Cataloging App",
    description: "Scan barcodes. Track live eBay values. Catalog books, vinyl, games & more. No subscription ever. Mac · Windows · Android · iOS.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "en-GB": SITE_URL,
      "en-AU": SITE_URL,
      "en-CA": SITE_URL,
      "en-IN": SITE_URL,
      "en-SG": SITE_URL,
      "en-NZ": SITE_URL,
      "en-IE": SITE_URL,
      "en-ZA": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  verification: { google: "ucvQARZ4fEmfMp2ZPlNlRS9Is64DsNcfC4ybeaT7Yb4" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: "#FAF6EE", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <head>
        <meta name="theme-color" content="#FAF6EE" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <meta name="author" content="Marrow Library" />
        <meta name="copyright" content="Marrow Library 2026" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="7 days" />
        <meta property="og:locale" content="en_US" />
        <meta name="application-name" content="Marrow Library" />
        <meta name="msapplication-TileColor" content="#C24B24" />
        {/* Ahrefs Analytics */}
        <script async src="https://analytics.ahrefs.com/analytics.js" data-key="9Bj+g0yBYup0W6rW6XA41A" />
        <script dangerouslySetInnerHTML={{ __html: `
          var ahrefs_analytics_script = document.createElement('script');
          ahrefs_analytics_script.async = true;
          ahrefs_analytics_script.src = 'https://analytics.ahrefs.com/analytics.js';
          ahrefs_analytics_script.setAttribute('data-key', '9Bj+g0yBYup0W6rW6XA41A');
          document.getElementsByTagName('head')[0].appendChild(ahrefs_analytics_script);
        `}} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-EF1S0V31MJ" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-EF1S0V31MJ');
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
