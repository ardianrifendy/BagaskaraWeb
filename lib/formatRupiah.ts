/**
 * Formats a number to Indonesian Rupiah (e.g., 3499000 -> "Rp 3.499.000")
 */
export function formatRupiah(value: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `Rp ${formatted}`;
}
