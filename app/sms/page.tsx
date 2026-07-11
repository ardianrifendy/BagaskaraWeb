/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { formatRupiah } from "@/lib/formatRupiah";
import {
  parseGetBalance,
  parseGetNumber,
  parseGetStatus,
  parseSetStatus,
  parseCountriesJson,
  parseServicesJson,
  parseOperatorsJson,
  parseActiveActivationsJson,
} from "@/lib/smsProto";
import type {
  Activation,
  ActivationStatusCode,
  CountryRow,
  OperatorRow,
  ServiceRow,
  SmsLogEntry,
  SmsProxyResponse,
} from "@/types/sms";

const POLL_INTERVAL_MS = 5_000;
const REFRESH_ACTIVATIONS_MS = 15_000;
const MAX_POLL_AGE_MS = 20 * 60 * 1000; // 20 menit
const MAX_LOG_ENTRIES = 100;

const SERVICE_SHORTCUTS: { code: string; label: string; emoji: string }[] = [
  { code: "wa", label: "WhatsApp", emoji: "💬" },
  { code: "tg", label: "Telegram", emoji: "✈️" },
  { code: "go", label: "Google / Gmail", emoji: "🔍" },
];

function playAlertSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new Ctx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.warn("Failed to play audio alert", e);
  }
}

function statusBadge(status: ActivationStatusCode): { label: string; className: string } {
  switch (status) {
    case "waiting":
      return {
        label: "Menunggu SMS",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
      };
    case "waiting_retry":
      return {
        label: "Menunggu SMS berikutnya",
        className: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-900",
      };
    case "code_received":
      return {
        label: "SMS diterima",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900",
      };
    case "finished":
      return {
        label: "Selesai",
        className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
      };
    case "canceled":
      return {
        label: "Dibatalkan",
        className: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900",
      };
    default:
      return {
        label: "Tidak diketahui",
        className: "bg-neutral-100 text-neutral-700 dark:bg-zinc-800 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700",
      };
  }
}

function formatElapsed(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SmsDashboardPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [operators, setOperators] = useState<OperatorRow[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>("6"); // Indonesia
  const [selectedService, setSelectedService] = useState<string>("wa");
  const [selectedOperator, setSelectedOperator] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [fixedPrice, setFixedPrice] = useState<boolean>(false);
  const [phoneException, setPhoneException] = useState<string>("");

  const [activations, setActivations] = useState<Activation[]>([]);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [logsOpen, setLogsOpen] = useState<boolean>(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const logsBoxRef = useRef<HTMLDivElement | null>(null);
  const activationsRef = useRef<Activation[]>([]);
  useEffect(() => {
    activationsRef.current = activations;
  }, [activations]);

  // ---------- Log helper ----------
  const pushLog = useCallback((entry: Omit<SmsLogEntry, "ts">) => {
    setLogs(prev => {
      const next: SmsLogEntry[] = [...prev, { ...entry, ts: Date.now() }];
      if (next.length > MAX_LOG_ENTRIES) next.splice(0, next.length - MAX_LOG_ENTRIES);
      return next;
    });
  }, []);

  // ---------- Fetch helper ----------
  const callSms = useCallback(
    async <T = string,>(action: string, extra?: Record<string, string>): Promise<SmsProxyResponse<T>> => {
      const params = new URLSearchParams();
      params.set("action", action);
      if (apiKey.trim()) params.set("api_key", apiKey.trim());
      if (extra) {
        for (const [k, v] of Object.entries(extra)) {
          if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
      }
      let payload: SmsProxyResponse<T>;
      try {
        const res = await fetch(`/api/sms?${params.toString()}`, { cache: "no-store" });
        payload = (await res.json()) as SmsProxyResponse<T>;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        payload = { ok: false, action, error: `Gagal menghubungi proxy: ${message}`, raw: "" };
      }
      pushLog({
        action: `${action}${extra?.id ? `#${extra.id}` : ""}`,
        ok: payload.ok,
        msg: payload.ok ? (payload.raw ? payload.raw.slice(0, 200) : "OK") : payload.error,
      });
      return payload;
    },
    [apiKey, pushLog]
  );

  // ---------- Refresh balance ----------
  const refreshBalance = useCallback(async () => {
    setRefreshingBalance(true);
    const res = await callSms("getBalance");
    if (res.ok) setBalance(parseGetBalance(res.raw));
    setRefreshingBalance(false);
  }, [callSms]);

  // ---------- Refresh countries/services ----------
  const refreshCatalog = useCallback(async () => {
    const [c, s] = await Promise.all([callSms("getCountries"), callSms("getServicesList", { country: selectedCountry })]);
    if (c.ok) setCountries(parseCountriesJson(c.raw));
    if (s.ok) setServices(parseServicesJson(s.raw));
  }, [callSms, selectedCountry]);

  const refreshOperators = useCallback(async (countryId: string) => {
    const res = await callSms("getOperators", { country: countryId });
    if (res.ok) setOperators(parseOperatorsJson(res.raw));
  }, [callSms]);

  const refreshActivations = useCallback(async () => {
    const res = await callSms("getActiveActivations");
    if (!res.ok) return;
    const upstream = parseActiveActivationsJson(res.raw);
    if (upstream.length === 0) return;
    setActivations(prev => {
      const byId = new Map(prev.map(a => [a.id, a]));
      for (const item of upstream) {
        const existing = byId.get(item.id);
        byId.set(item.id, existing ? { ...item, smsCode: existing.smsCode ?? item.smsCode, status: existing.status === "code_received" ? existing.status : item.status } : item);
      }
      return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
    });
  }, [callSms]);

  // ---------- Initial load ----------
  useEffect(() => {
    void refreshBalance();
    void refreshCatalog();
    void refreshOperators(selectedCountry);
    void refreshActivations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch operators when country changes
  useEffect(() => {
    void refreshOperators(selectedCountry);
  }, [selectedCountry, refreshOperators]);

  // Auto-refresh activations
  useEffect(() => {
    const id = setInterval(() => void refreshActivations(), REFRESH_ACTIVATIONS_MS);
    return () => clearInterval(id);
  }, [refreshActivations]);

  // Elapsed timer tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Polling getStatus every 5s for waiting/waiting_retry activations (limit 4 concurrent)
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const list = activationsRef.current.filter(a =>
        (a.status === "waiting" || a.status === "waiting_retry") &&
        (Date.now() - a.createdAt) < MAX_POLL_AGE_MS
      );
      if (list.length === 0) return;
      const CONCURRENCY = 4;
      for (let i = 0; i < list.length; i += CONCURRENCY) {
        if (cancelled) return;
        const chunk = list.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(async a => {
          const res = await callSms("getStatus", { id: a.id });
          if (!res.ok) return;
          const parsed = parseGetStatus(res.raw);
          if (parsed.status === a.status && !parsed.smsCode) return;
          setActivations(prev => prev.map(x => {
            if (x.id !== a.id) return x;
            const isNewCode = parsed.status === "code_received" && !x.smsCode;
            if (isNewCode) playAlertSound();
            return { ...x, status: parsed.status, smsCode: parsed.smsCode ?? x.smsCode, raw: res.raw };
          }));
        }));
      }
    };
    const id = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [callSms]);

  // Auto-scroll log
  useEffect(() => {
    if (!logsOpen) return;
    const el = logsBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs, logsOpen]);

  // ---------- Order action ----------
  const handleOrder = useCallback(async () => {
    if (!selectedService || !selectedCountry) return;
    setOrderLoading(true);
    const res = await callSms("getNumber", {
      service: selectedService,
      country: selectedCountry,
      operator: selectedOperator || "any",
      maxPrice: maxPrice.trim(),
      fixedPrice: fixedPrice ? "1" : "",
      phoneException: phoneException.trim(),
    });
    setOrderLoading(false);
    if (!res.ok) return;
    const parsed = parseGetNumber(res.raw);
    if (!parsed) return;
    const service = services.find(s => s.code === selectedService);
    const cost = parseFloat(maxPrice) || 0;
    const newAct: Activation = {
      id: parsed.id,
      number: parsed.number,
      serviceCode: selectedService,
      serviceName: service?.name,
      operator: selectedOperator,
      countryId: selectedCountry,
      cost,
      createdAt: Date.now(),
      status: "waiting",
      canRetry: true,
      canFinish: true,
      canCancel: true,
    };
    setActivations(prev => [newAct, ...prev.filter(a => a.id !== newAct.id)]);
    void refreshBalance();
  }, [callSms, selectedService, selectedCountry, selectedOperator, maxPrice, fixedPrice, phoneException, services, refreshBalance]);

  // ---------- setStatus actions ----------
  const handleSetStatus = useCallback(async (activationId: string, status: 3 | 6 | 8) => {
    setStatusLoading(prev => ({ ...prev, [`${activationId}:${status}`]: true }));
    const res = await callSms("setStatus", { id: activationId, status: String(status) });
    setStatusLoading(prev => {
      const next = { ...prev };
      delete next[`${activationId}:${status}`];
      return next;
    });
    if (!res.ok) return;
    const parsed = parseSetStatus(res.raw);
    if (!parsed.ok) return;
    if (status === 6) {
      setActivations(prev => prev.map(a => a.id === activationId ? { ...a, status: "finished" } : a));
      setTimeout(() => setActivations(prev => prev.filter(a => a.id !== activationId)), 800);
    } else if (status === 8) {
      setActivations(prev => prev.map(a => a.id === activationId ? { ...a, status: "canceled" } : a));
      setTimeout(() => setActivations(prev => prev.filter(a => a.id !== activationId)), 800);
    } else if (status === 3) {
      setActivations(prev => prev.map(a => a.id === activationId ? { ...a, status: "waiting_retry", smsCode: undefined } : a));
    }
    void refreshBalance();
  }, [callSms, refreshBalance]);

  // ---------- Clipboard ----------
  const copyText = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 1500);
    } catch (e) {
      console.warn("Clipboard failed", e);
    }
  }, []);

  const hasWaiting = useMemo(
    () => activations.some(a => a.status === "waiting" || a.status === "waiting_retry"),
    [activations]
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="text-xs font-bold text-neutral-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Katalog
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-neutral-800 dark:text-zinc-100 tracking-tight">
            SMS Activation Dashboard
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-zinc-400">
            Order nomor virtual untuk verifikasi WhatsApp / Telegram / Google. Internal tool — via provider litensi.id.
          </p>
        </div>

        {/* Balance card */}
        <section className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Saldo</div>
              <div className="text-2xl md:text-3xl font-black text-neutral-800 dark:text-zinc-100 mt-0.5">
                {balance === null ? (
                  <span className="text-neutral-400 dark:text-zinc-600">—</span>
                ) : (
                  formatRupiah(balance)
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Pakai API key default server"
                className="w-full md:w-72 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
              <button
                type="button"
                onClick={refreshBalance}
                disabled={refreshingBalance}
                className="rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 transition-colors"
              >
                {refreshingBalance ? "Memuat…" : "Refresh Saldo"}
              </button>
            </div>
          </div>
        </section>

        {/* Order form */}
        <section className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-neutral-800 dark:text-zinc-100 uppercase tracking-wider">Pesan Nomor</h2>
          </div>

          {/* Shortcut chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SERVICE_SHORTCUTS.map(sc => (
              <button
                key={sc.code}
                type="button"
                onClick={() => setSelectedService(sc.code)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  selectedService === sc.code
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-neutral-50 dark:bg-zinc-800/60 border-neutral-200 dark:border-zinc-700 text-neutral-700 dark:text-zinc-300 hover:border-orange-400"
                }`}
              >
                <span>{sc.emoji}</span>
                {sc.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Negara</span>
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {countries.length === 0 && <option value="6">Indonesia (default)</option>}
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.eng} ({c.id})</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Layanan</span>
              <select
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                className="rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {services.length === 0 && (
                  <>
                    <option value="wa">WhatsApp (wa)</option>
                    <option value="tg">Telegram (tg)</option>
                    <option value="go">Google (go)</option>
                  </>
                )}
                {services.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Operator</span>
              <select
                value={selectedOperator}
                onChange={e => setSelectedOperator(e.target.value)}
                className="rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {operators.length === 0 && <option value="any">Any</option>}
                {operators.map(o => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Harga Maks. (Rp)</span>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="mis. 5000"
                min={0}
                className="rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Pengecualian Prefix</span>
              <input
                type="text"
                value={phoneException}
                onChange={e => setPhoneException(e.target.value)}
                placeholder="mis. 62811,62812"
                className="rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </label>

            <label className="flex items-center gap-2 md:mt-6">
              <input
                type="checkbox"
                checked={fixedPrice}
                onChange={e => setFixedPrice(e.target.checked)}
                className="w-4 h-4 accent-orange-600"
              />
              <span className="text-sm text-neutral-700 dark:text-zinc-300">Fixed price (kunci harga maksimal)</span>
            </label>
          </div>

          <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              Nomor akan aktif ~20 menit. Kalau SMS tidak masuk, tekan <b>Cancel</b> untuk refund.
            </p>
            <button
              type="button"
              onClick={handleOrder}
              disabled={orderLoading}
              className="w-full md:w-auto rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 transition-colors"
            >
              {orderLoading ? "Memesan…" : "Pesan Nomor"}
            </button>
          </div>
        </section>

        {/* Active activations */}
        <section className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-neutral-800 dark:text-zinc-100 uppercase tracking-wider">Aktivasi Aktif</h2>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
                {activations.length} nomor{hasWaiting ? " · polling berjalan" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshActivations()}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          {activations.length === 0 ? (
            <div className="text-sm text-neutral-500 dark:text-zinc-400 py-6 text-center">
              Belum ada nomor aktif. Pesan nomor di atas untuk mulai.
            </div>
          ) : (
            <ul className="space-y-3">
              {activations.map(act => {
                const badge = statusBadge(act.status);
                const elapsed = now - act.createdAt;
                const remaining = MAX_POLL_AGE_MS - elapsed;
                return (
                  <li
                    key={act.id}
                    className="rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-neutral-50/60 dark:bg-zinc-950/40 p-4 md:p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${badge.className}`}>
                            {badge.label}
                          </span>
                          {act.serviceName && (
                            <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                              {act.serviceName}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">
                            {act.serviceCode.toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => void copyText(act.number, `num-${act.id}`)}
                            className="font-mono text-base md:text-lg font-black text-neutral-800 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                            title="Klik untuk salin"
                          >
                            {act.number}
                          </button>
                          {copiedKey === `num-${act.id}` && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-500 dark:text-zinc-400">
                          ID: {act.id} · Biaya: {formatRupiah(act.cost)} · Berjalan: {formatElapsed(elapsed)}
                          {remaining > 0 && (act.status === "waiting" || act.status === "waiting_retry") && (
                            <> · Sisa: {formatElapsed(remaining)}</>
                          )}
                        </div>

                        {act.status === "code_received" && act.smsCode && (
                          <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Kode SMS</div>
                              <div className="text-3xl md:text-4xl font-black tracking-widest text-emerald-800 dark:text-emerald-200 mt-0.5 font-mono">
                                {act.smsCode}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void copyText(act.smsCode ?? "", `code-${act.id}`)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 transition-colors"
                            >
                              {copiedKey === `code-${act.id}` ? "Tersalin!" : "Salin Kode"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 md:min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => void handleSetStatus(act.id, 3)}
                          disabled={!!statusLoading[`${act.id}:3`]}
                          className="flex-1 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold px-3 py-2 hover:bg-sky-100 dark:hover:bg-sky-950/60 disabled:opacity-60 transition-colors"
                        >
                          Minta SMS Lagi
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSetStatus(act.id, 6)}
                          disabled={!!statusLoading[`${act.id}:6`]}
                          className="flex-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-2 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 disabled:opacity-60 transition-colors"
                        >
                          Selesai
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSetStatus(act.id, 8)}
                          disabled={!!statusLoading[`${act.id}:8`]}
                          className="flex-1 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold px-3 py-2 hover:bg-rose-100 dark:hover:bg-rose-950/60 disabled:opacity-60 transition-colors"
                        >
                          Batalkan
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Log panel */}
        <section className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setLogsOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-left"
          >
            <div>
              <span className="text-sm font-extrabold text-neutral-800 dark:text-zinc-100 uppercase tracking-wider">Log Aktivitas</span>
              <span className="ml-2 text-xs text-neutral-500 dark:text-zinc-400">({logs.length})</span>
            </div>
            <span className="text-neutral-500 dark:text-zinc-400 text-xs font-bold">{logsOpen ? "Sembunyikan" : "Tampilkan"}</span>
          </button>
          {logsOpen && (
            <div
              ref={logsBoxRef}
              className="max-h-64 overflow-y-auto border-t border-neutral-100 dark:border-zinc-800 bg-neutral-50/60 dark:bg-zinc-950/40 px-5 py-3 font-mono text-[11px] leading-relaxed"
            >
              {logs.length === 0 ? (
                <div className="text-neutral-400 dark:text-zinc-600">Belum ada aktivitas.</div>
              ) : (
                logs.map((l, idx) => (
                  <div key={idx} className={l.ok ? "text-neutral-700 dark:text-zinc-300" : "text-rose-600 dark:text-rose-400"}>
                    <span className="text-neutral-400 dark:text-zinc-500">
                      {new Date(l.ts).toLocaleTimeString("id-ID", { hour12: false })}
                    </span>{" "}
                    <span className="font-bold">{l.action}</span> — {l.msg}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-6 px-4 text-center text-[10px] text-neutral-400 dark:text-zinc-500 font-medium">
        Internal tool · Provider: litensi.id
      </footer>
    </div>
  );
}
