export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount).replace('IDR', 'Rp ').trim();
}

export function formatPct(pct: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(pct / 100);
}
