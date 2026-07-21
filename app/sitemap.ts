import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bagaskaracell.net";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/kalkulator/shopee`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/kalkulator/tokopedia`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cek-resi`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/prediction`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/jastip`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/jastip/kalkulator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/jastip/ketentuan`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
