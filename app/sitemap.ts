import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bagaskaracell.net";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/kalkulator/shopee`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/kalkulator/tokopedia`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cek-resi`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
