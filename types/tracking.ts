// Kode kurir yang didukung BinderByte
export type CourierCode =
  | "jne"
  | "pos"
  | "jnt"
  | "sicepat"
  | "tiki"
  | "anteraja"
  | "wahana"
  | "ninja"
  | "lion"
  | "spx";

// Bentuk mentah response BinderByte (GET /v1/track)
export interface BinderByteSummary {
  awb: string;
  courier: string;
  service: string;
  status: string;
  date: string;
  desc: string;
  amount: string;
  weight: string;
  receiver: string;
}

export interface BinderByteDetail {
  origin: string;
  destination: string;
  shipper: string;
  receiver: string;
}

export interface BinderByteHistoryItem {
  date: string;
  desc: string;
  location: string;
}

export interface BinderByteTrackData {
  summary: BinderByteSummary;
  detail: BinderByteDetail;
  history: BinderByteHistoryItem[];
}

export interface BinderByteResponse {
  status: number;
  message: string;
  data?: BinderByteTrackData;
}

// Bentuk internal hasil mapping, dipakai API route & komponen UI
export interface TrackingSummary {
  awb: string;
  courier: CourierCode;
  service: string;
  status: string;
  lastUpdate: string;
  lastDesc: string;
  receiver: string;
  weight: string;
}

export interface TrackingDetail {
  origin: string;
  destination: string;
  shipper: string;
  receiver: string;
}

export interface TrackingHistoryItem {
  date: string;
  desc: string;
  location: string;
}

export interface TrackingResult {
  summary: TrackingSummary;
  detail: TrackingDetail;
  history: TrackingHistoryItem[];
}

// Envelope response /api/cek-resi — error selalu bawa pesan WA fallback
export type CekResiApiResponse =
  | { ok: true; result: TrackingResult }
  | { ok: false; error: string; waFallbackMessage: string };
