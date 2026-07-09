import { redirect } from "next/navigation";
import { getProductBySlug } from "../../../lib/filterProducts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates dynamic SEO metadata for each individual product page.
 */
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan — Bagaskara Cell",
      description: "Halaman produk yang Anda cari tidak dapat ditemukan di toko kami."
    };
  }

  // Get default starting price
  const startingPrice = product.variants.length > 0 
    ? Math.min(...product.variants.map(v => v.price)) 
    : 0;

  // Format price if available
  const priceText = startingPrice > 0 
    ? ` mulai dari Rp ${new Intl.NumberFormat("id-ID").format(startingPrice)}`
    : "";

  return {
    title: `${product.brand} ${product.name} (${product.condition === "baru" ? "Baru" : "Second"}) — Bagaskara Cell`,
    description: `Beli ${product.brand} ${product.name} ${product.condition === "baru" ? "Baru" : "Second"}${priceText} di Gresik. Spesifikasi lengkap, info garansi, kelengkapan unit, dan chat WhatsApp.`,
    openGraph: {
      title: `${product.brand} ${product.name} (${product.condition === "baru" ? "Baru" : "Second"}) — Bagaskara Cell`,
      description: `Beli ${product.brand} ${product.name} ${product.condition === "baru" ? "Baru" : "Second"}${priceText} di Gresik. Spesifikasi lengkap, info garansi, kelengkapan unit, dan chat WhatsApp.`,
      type: "website",
      locale: "id_ID"
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  // Redirect to the home page with the ?produk= query param so it opens in the focused modal popup!
  redirect(`/?produk=${resolvedParams.slug}`);
}
