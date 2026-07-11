/**
 * Algoritma pembulatan psikologis
 * < Rp10.000     → bulatkan ke atas ke ...500 / ...900
 * Rp10rb–100rb   → bulatkan ke atas ke ...900 (mis. 47.350 → 47.900)
 * Rp100rb–1jt    → bulatkan ke atas ke ...9.000 (mis. 187.432 → 189.000)
 * > Rp1jt        → bulatkan ke atas ke ...99.000 (mis. 3.214.500 → 3.299.000)
 */
export function roundPsychological(raw: number): number {
  if (raw <= 0) return 0;
  const rawInt = Math.ceil(raw); // Pastikan integer dulu (bulatkan ke atas agar tidak rugi)

  if (rawInt < 10000) {
    const remainder = rawInt % 1000;
    const base = rawInt - remainder;
    if (remainder === 0) return rawInt;
    if (remainder <= 500) return base + 500;
    return base + 900;
  }

  if (rawInt < 100000) {
    const remainder = rawInt % 1000;
    const base = rawInt - remainder;
    if (remainder === 0) return rawInt;
    if (remainder <= 900) return base + 900;
    return base + 1900; // naik ke ribuan berikutnya
  }

  if (rawInt < 1000000) {
    const remainder = rawInt % 10000;
    const base = rawInt - remainder;
    if (remainder === 0) return rawInt;
    if (remainder <= 9000) return base + 9000;
    return base + 19000;
  }

  // >= 1 Juta
  const remainder = rawInt % 100000;
  const base = rawInt - remainder;
  if (remainder === 0) return rawInt;
  if (remainder <= 99000) return base + 99000;
  return base + 199000;
}
