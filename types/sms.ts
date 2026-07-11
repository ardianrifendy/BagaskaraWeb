// Types untuk SMS Activation Tool (integrasi litensi.id / protokol SMS-Activate)

export type SmsActionQuery = Record<string, string | number | boolean | undefined>;

export interface CountryRow {
  id: string;
  rus?: string;
  eng: string;
  chn?: string;
}

export interface ServiceRow {
  code: string;
  name: string;
}

export interface OperatorRow {
  code: string;
  name: string;
}

// Status aktivasi (mapping dari respon getStatus upstream)
// - STATUS_WAIT_CODE       -> "waiting"
// - STATUS_WAIT_RETRY      -> "waiting_retry"
// - STATUS_OK:<code>       -> "code_received"
// - ACCESS_ACTIVATION      -> "finished"
// - STATUS_CANCEL / ACCESS_CANCEL -> "canceled"
export type ActivationStatusCode =
  | "waiting"
  | "waiting_retry"
  | "code_received"
  | "finished"
  | "canceled"
  | "unknown";

export interface Activation {
  id: string;
  number: string;
  serviceCode: string;
  serviceName?: string;
  operator?: string;
  countryId?: string;
  cost: number;
  createdAt: number;
  status: ActivationStatusCode;
  smsCode?: string;
  canRetry?: boolean;
  canFinish?: boolean;
  canCancel?: boolean;
  raw?: string;
}

// Envelope response dari proxy `/api/sms`
export type SmsProxyResponse<T = unknown> =
  | { ok: true; action: string; data: T; raw: string }
  | { ok: false; action: string; error: string; raw: string; upstreamStatus?: number };

// Payload log entry di dashboard
export interface SmsLogEntry {
  ts: number;
  action: string;
  ok: boolean;
  msg: string;
}
