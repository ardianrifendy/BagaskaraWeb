import type {
  ActivationStatusCode,
  Activation,
  CountryRow,
  ServiceRow,
  OperatorRow,
} from "@/types/sms";

// ----- Balance -----
// Upstream format: "ACCESS_BALANCE:12345.67"
export function parseGetBalance(raw: string): number {
  const trimmed = raw.trim();
  const match = trimmed.match(/^ACCESS_BALANCE:([\d.]+)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : 0;
}

// ----- getNumber -----
// Upstream format: "ACCESS_NUMBER:<activationId>:<msisdn>"
export function parseGetNumber(raw: string): { id: string; number: string } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^ACCESS_NUMBER:([^:]+):(.+)$/i);
  if (!match) return null;
  return { id: match[1].trim(), number: match[2].trim() };
}

// ----- getStatus -----
export function parseGetStatus(raw: string): { status: ActivationStatusCode; smsCode?: string } {
  const trimmed = raw.trim();
  if (/^STATUS_WAIT_CODE/i.test(trimmed)) return { status: "waiting" };
  if (/^STATUS_WAIT_RETRY/i.test(trimmed)) return { status: "waiting_retry" };
  if (/^STATUS_OK/i.test(trimmed)) {
    const parts = trimmed.split(":");
    const code = parts.slice(1).join(":").trim();
    return { status: "code_received", smsCode: code || undefined };
  }
  if (/^STATUS_CANCEL/i.test(trimmed) || /^ACCESS_CANCEL/i.test(trimmed)) return { status: "canceled" };
  if (/^ACCESS_ACTIVATION/i.test(trimmed)) return { status: "finished" };
  return { status: "unknown" };
}

// ----- setStatus response -----
// Return true kalau access-terkait sukses.
export function parseSetStatus(raw: string): { ok: boolean; message: string } {
  const trimmed = raw.trim();
  if (/^ACCESS_READY/i.test(trimmed)) return { ok: true, message: "Nomor siap menerima SMS lagi." };
  if (/^ACCESS_RETRY_GET/i.test(trimmed)) return { ok: true, message: "Menunggu SMS berikutnya." };
  if (/^ACCESS_ACTIVATION/i.test(trimmed)) return { ok: true, message: "Aktivasi diselesaikan." };
  if (/^ACCESS_CANCEL/i.test(trimmed)) return { ok: true, message: "Aktivasi dibatalkan." };
  return { ok: false, message: trimmed };
}

// ----- Countries / Services / Operators (JSON) -----
function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parseCountriesJson(raw: string): CountryRow[] {
  const data = safeParseJson(raw);
  const result: CountryRow[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const id = String(rec.id ?? rec.code ?? "");
        const eng = String(rec.eng ?? rec.name ?? rec.rus ?? id);
        if (id) result.push({ id, eng, rus: rec.rus ? String(rec.rus) : undefined });
      }
    }
    return result;
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object") {
        const rec = value as Record<string, unknown>;
        const id = String(rec.id ?? key);
        const eng = String(rec.eng ?? rec.name ?? rec.rus ?? id);
        result.push({ id, eng, rus: rec.rus ? String(rec.rus) : undefined });
      } else if (typeof value === "string") {
        result.push({ id: key, eng: value });
      }
    }
  }
  return result;
}

export function parseServicesJson(raw: string): ServiceRow[] {
  const data = safeParseJson(raw);
  const result: ServiceRow[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const code = String(rec.code ?? rec.service ?? "");
        const name = String(rec.name ?? rec.eng ?? rec.rus ?? code);
        if (code) result.push({ code, name });
      }
    }
    return result;
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") result.push({ code: key, name: value });
      else if (value && typeof value === "object") {
        const rec = value as Record<string, unknown>;
        const name = String(rec.name ?? rec.eng ?? rec.rus ?? key);
        result.push({ code: key, name });
      }
    }
  }
  return result;
}

export function parseOperatorsJson(raw: string): OperatorRow[] {
  const data = safeParseJson(raw);
  const result: OperatorRow[] = [];
  const pushOp = (code: string, name?: string) => {
    if (!code) return;
    result.push({ code, name: name || code });
  };
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "string") pushOp(item);
      else if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        pushOp(String(rec.code ?? rec.id ?? ""), rec.name ? String(rec.name) : undefined);
      }
    }
    return result;
  }
  if (data && typeof data === "object") {
    // Struktur umum: { "6": { "operators": ["any", "telkomsel"] } } atau { "any": "Any" }
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") pushOp(key, value);
      else if (Array.isArray(value)) {
        for (const v of value) if (typeof v === "string") pushOp(v);
      } else if (value && typeof value === "object") {
        const rec = value as Record<string, unknown>;
        const ops = rec.operators;
        if (Array.isArray(ops)) {
          for (const v of ops) if (typeof v === "string") pushOp(v);
        } else {
          pushOp(key, rec.name ? String(rec.name) : undefined);
        }
      }
    }
  }
  // Pastikan "any" selalu ada di depan
  if (!result.some(o => o.code.toLowerCase() === "any")) {
    result.unshift({ code: "any", name: "Any (semua operator)" });
  }
  return result;
}

// ----- getActiveActivations (JSON) -----
export function parseActiveActivationsJson(raw: string): Activation[] {
  const data = safeParseJson(raw);
  const rows: unknown[] = [];
  if (Array.isArray(data)) rows.push(...data);
  else if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const nested = rec.activeActivations ?? rec.activations ?? rec.data ?? null;
    if (Array.isArray(nested)) rows.push(...nested);
    else rows.push(...Object.values(rec));
  }
  const result: Activation[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = String(rec.activationId ?? rec.id ?? "");
    const number = String(rec.phoneNumber ?? rec.number ?? rec.phone ?? "");
    if (!id || !number) continue;
    const cost = Number(rec.activationCost ?? rec.cost ?? rec.price ?? 0);
    const created = Number(rec.activationTime ?? rec.timestamp ?? rec.created ?? 0);
    const statusRaw = String(rec.status ?? rec.activationStatus ?? "");
    let status: ActivationStatusCode = "waiting";
    if (/finish|access_activation/i.test(statusRaw)) status = "finished";
    else if (/cancel/i.test(statusRaw)) status = "canceled";
    else if (/retry/i.test(statusRaw)) status = "waiting_retry";
    else if (/ok/i.test(statusRaw) || rec.smsCode) status = "code_received";
    result.push({
      id,
      number,
      serviceCode: String(rec.serviceCode ?? rec.service ?? ""),
      serviceName: rec.serviceName ? String(rec.serviceName) : undefined,
      operator: rec.operator ? String(rec.operator) : undefined,
      countryId: rec.countryCode ? String(rec.countryCode) : undefined,
      cost: Number.isFinite(cost) ? cost : 0,
      createdAt: Number.isFinite(created) && created > 0 ? created * (created < 10_000_000_000 ? 1000 : 1) : Date.now(),
      status,
      smsCode: rec.smsCode ? String(rec.smsCode) : undefined,
    });
  }
  return result;
}

// ----- Error mapping -----
const ERROR_CODES = [
  "NO_KEY",
  "BAD_KEY",
  "NO_BALANCE",
  "NO_NUMBERS",
  "BAD_SERVICE",
  "BAD_STATUS",
  "BAD_ACTION",
  "BAD_ACTIVATION_ID",
  "WRONG_ACTIVATION_ID",
  "EARLY_CANCEL_DENIED",
  "TOO_MANY_ACTIVE_ACTIVATIONS",
] as const;

export function detectErrorCode(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  for (const code of ERROR_CODES) {
    if (trimmed.startsWith(code)) return code;
  }
  return null;
}

export function friendlyError(rawOrCode: string): string {
  const code = detectErrorCode(rawOrCode) ?? rawOrCode.trim().toUpperCase();
  switch (code) {
    case "NO_KEY":
      return "API key kosong. Isi API key di field bagian atas.";
    case "BAD_KEY":
      return "API key salah atau tidak dikenal.";
    case "NO_BALANCE":
      return "Saldo tidak mencukupi untuk melakukan pesanan.";
    case "NO_NUMBERS":
      return "Stok nomor untuk kombinasi negara + layanan + operator sedang kosong. Coba lagi sebentar.";
    case "BAD_SERVICE":
      return "Kode layanan tidak valid untuk negara yang dipilih.";
    case "BAD_STATUS":
      return "Status tidak valid (mungkin nomor sudah selesai/cancel).";
    case "BAD_ACTION":
      return "Action tidak dikenal oleh provider.";
    case "BAD_ACTIVATION_ID":
    case "WRONG_ACTIVATION_ID":
      return "ID aktivasi tidak dikenal.";
    case "EARLY_CANCEL_DENIED":
      return "Belum bisa dibatalkan — tunggu minimal 2 menit sejak nomor dipesan.";
    case "TOO_MANY_ACTIVE_ACTIVATIONS":
      return "Batas jumlah nomor aktif tercapai. Selesaikan/cancel dulu nomor yang tidak dipakai.";
    default:
      return `Error dari provider: ${rawOrCode.trim()}`;
  }
}
