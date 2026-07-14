import { customAlphabet } from "nanoid";

// Crockford Base32 alphabet without ambiguous letters: 0 O 1 I L U
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const nano = customAlphabet(ALPHABET, 8);

/**
 * Generates a random crypto-secure order code in JST-XXXX-XXXX format.
 */
export function generateOrderCode(): string {
  const raw = nano();
  return `JST-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/**
 * Normalizes input code to case-insensitive and dash-insensitive JST-XXXX-XXXX format.
 */
export function normalizeOrderCode(input: string): string {
  const clean = (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Remove leading JST if present (e.g. JSTABCDEFGH -> ABCDEFGH)
  const s = clean.startsWith("JST") ? clean.substring(3) : clean;

  if (s.length < 8) {
    return `JST-${s}`;
  }
  return `JST-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}
