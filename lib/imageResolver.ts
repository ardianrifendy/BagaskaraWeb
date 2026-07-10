/**
 * Helper to construct the local image path based on the scraper's naming convention.
 * The scraper stores files in the folder: images/[Brand]/[Name]/[Warna]
 * and names files: [SKU_Induk]_[WarnaWithUnderscores]_[index].webp
 */
export function getLocalImageSrc(
  brand: string,
  productName: string,
  color: string,
  skuInduk: string | undefined,
  index: number,
  fallbackUrl: string
): string {
  if (!skuInduk || skuInduk === "-" || !color || color === "-") {
    return fallbackUrl;
  }

  // Clean brand, productName, color to match python's safe_filename
  const cleanBrand = brand.replace(/[^a-zA-Z0-9_\-\. ]/g, "").trim();
  const cleanProductName = productName.replace(/[^a-zA-Z0-9_\-\. ]/g, "").trim();
  const cleanColor = color.replace(/[^a-zA-Z0-9_\-\. ]/g, "").trim();

  // Extract extension from fallbackUrl
  let ext = fallbackUrl.split("?")[0].split(".").pop() || "webp";
  if (ext.length > 5 || !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    ext = "webp";
  }

  // Construct filename: SKUInduk_WarnaWithUnderscores_index.ext
  const filename = `${skuInduk}_${cleanColor.replace(/ /g, "_")}_${index + 1}.${ext}`;
  
  // Return public local path
  return `/images/${cleanBrand}/${cleanProductName}/${cleanColor}/${filename}`;
}
