import type { CourierCode } from "@/types/tracking";

export interface CourierOption {
  code: CourierCode;
  label: string;
}

// Whitelist kurir sesuai dokumentasi BinderByte
// Jangan terima courier di luar daftar ini (buang-buang kuota API kalau salah value).
export const SUPPORTED_COURIERS: CourierOption[] = [
  { code: "jne", label: "JNE" },
  { code: "pos", label: "POS Indonesia" },
  { code: "jnt", label: "J&T Express" },
  { code: "sicepat", label: "SiCepat" },
  { code: "tiki", label: "TIKI" },
  { code: "anteraja", label: "AnterAja" },
  { code: "wahana", label: "Wahana" },
  { code: "ninja", label: "Ninja Xpress" },
  { code: "lion", label: "Lion Parcel" },
  { code: "spx", label: "SPX Express" },
];

const SUPPORTED_COURIER_CODES = new Set<string>(
  SUPPORTED_COURIERS.map((courier) => courier.code)
);

export function isSupportedCourier(value: string): value is CourierCode {
  return SUPPORTED_COURIER_CODES.has(value);
}

export function getCourierLabel(code: CourierCode): string {
  return SUPPORTED_COURIERS.find((courier) => courier.code === code)?.label ?? code;
}
