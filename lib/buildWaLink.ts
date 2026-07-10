import { siteConfig } from "../config/site";
import { formatRupiah } from "./formatRupiah";

/**
 * Builds a WhatsApp link with a pre-filled text template.
 * If product details are omitted, generates a general inquiry link.
 */
export function buildWaLink(
  productName?: string,
  color?: string,
  storage?: string,
  price?: number,
  isScraped?: boolean
): string {
  // Rotate WhatsApp leads 50/50 deterministically based on product name length, or randomly
  const waNumber = productName
    ? (productName.length % 2 === 0 ? siteConfig.whatsappNumber : siteConfig.whatsappNumber2)
    : (Math.random() > 0.5 ? siteConfig.whatsappNumber : siteConfig.whatsappNumber2);

  if (!productName || !color || !storage || price === undefined) {
    const defaultText = `Halo ${siteConfig.name}, saya ingin tanya-tanya mengenai stok HP di toko Anda.`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`;
  }

  const formattedPrice = formatRupiah(price);
  
  // Custom template based on whether the product is scraped (general price catalog) or local store stock
  const template = isScraped
    ? "Halo Bagaskara Cell, saya tertarik dengan {productName} ({variantColor} - {variantStorage}) seharga {price} di Katalog Harga. Apakah tipe ini bisa dipesan?"
    : "Halo Bagaskara Cell, saya tertarik dengan {productName} ({variantColor} - {variantStorage}) seharga {price} yang Ready Stok di Gresik. Apakah bisa COD hari ini?";

  const text = template
    .replace("{productName}", productName)
    .replace("{variantColor}", color)
    .replace("{variantStorage}", storage)
    .replace("{price}", formattedPrice);

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}
