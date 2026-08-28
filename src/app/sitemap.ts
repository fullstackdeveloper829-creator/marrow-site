import type { MetadataRoute } from "next";

const SITE_URL = "https://marrow-site.vercel.app";
const NOW = new Date("2026-06-08");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,                  lastModified: NOW, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/features`,    lastModified: NOW, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/reviews`,     lastModified: NOW, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/pricing`,     lastModified: NOW, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/download`,    lastModified: NOW, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/terms`,       lastModified: NOW, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_URL}/privacy`,     lastModified: NOW, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_URL}/refund`,      lastModified: NOW, changeFrequency: "yearly",  priority: 0.5 },
  ];
}
