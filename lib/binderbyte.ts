import type {
  BinderByteResponse,
  CourierCode,
  TrackingResult,
} from "@/types/tracking";

const DEFAULT_BASE_URL = "http://api.binderbyte.com/v1";
const REQUEST_TIMEOUT_MS = 8000;
const AWB_MAX_LENGTH = 30;
const AWB_PATTERN = /^[a-zA-Z0-9]+$/;

export type BinderByteErrorReason =
  | "invalid_input"
  | "not_found"
  | "timeout"
  | "upstream_error";

export class BinderByteError extends Error {
  reason: BinderByteErrorReason;

  constructor(reason: BinderByteErrorReason, message: string) {
    super(message);
    this.name = "BinderByteError";
    this.reason = reason;
  }
}

function assertValidAwb(awb: string): void {
  if (!awb || awb.length > AWB_MAX_LENGTH || !AWB_PATTERN.test(awb)) {
    throw new BinderByteError("invalid_input", "Nomor resi tidak valid.");
  }
}

// Fungsi murni: hanya bicara ke BinderByte + mapping response.
export async function trackPackage(
  courier: CourierCode,
  awb: string
): Promise<TrackingResult> {
  assertValidAwb(awb);

  const apiKey = process.env.BINDERBYTE_API_KEY;
  if (!apiKey) {
    throw new BinderByteError(
      "upstream_error",
      "BINDERBYTE_API_KEY belum diset di environment."
    );
  }

  const baseUrl = process.env.BINDERBYTE_BASE_URL ?? DEFAULT_BASE_URL;
  const url = new URL(`${baseUrl}/track`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("courier", courier);
  url.searchParams.set("awb", awb);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, cache: "no-store" });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[binderbyte] courier=${courier} awb=${awb} result=timeout`);
      throw new BinderByteError("timeout", "BinderByte tidak merespons, coba lagi.");
    }
    console.log(`[binderbyte] courier=${courier} awb=${awb} result=fetch_failed`);
    throw new BinderByteError("upstream_error", "Gagal menghubungi BinderByte.");
  } finally {
    clearTimeout(timeout);
  }

  let payload: BinderByteResponse;
  try {
    payload = await response.json();
  } catch {
    console.log(`[binderbyte] courier=${courier} awb=${awb} result=bad_json`);
    throw new BinderByteError("upstream_error", "Response BinderByte tidak valid.");
  }

  if (payload.status !== 200 || !payload.data) {
    console.log(
      `[binderbyte] courier=${courier} awb=${awb} result=not_found status=${payload.status}`
    );
    throw new BinderByteError(
      "not_found",
      payload.message || "Resi tidak ditemukan / kurir tidak sesuai."
    );
  }

  console.log(`[binderbyte] courier=${courier} awb=${awb} result=success`);

  const { summary, detail, history } = payload.data;

  return {
    summary: {
      awb: summary.awb,
      courier,
      service: summary.service,
      status: summary.status,
      lastUpdate: summary.date,
      lastDesc: summary.desc,
      receiver: summary.receiver,
      weight: summary.weight,
    },
    detail: {
      origin: detail.origin,
      destination: detail.destination,
      shipper: detail.shipper,
      receiver: detail.receiver,
    },
    history: history.map((item) => ({
      date: item.date,
      desc: item.desc,
      location: item.location,
    })),
  };
}
