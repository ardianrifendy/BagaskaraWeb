export type AssetId = "bitcoin" | "ethereum" | "solana" | "binancecoin" | "usd-idr" | "bbca" | "bbri" | "tlkm" | "asii" | "adro";

export interface Indicators {
  rsi14: number;                 // 0–100
  sma20: number;
  sma50: number;
  maCross: "golden" | "death" | "none";
  macd: { line: number; signal: number; histogram: number; state: "bullish" | "bearish"; isHistogramRising?: boolean };
  volumeChangePct: number;       // vs rata-rata 7 hari (kripto saja)
  fearGreed?: number;            // 0–100 (kripto saja)
  priceVsSma20Pct: number;
}

export interface ScenarioProbabilities {
  up: number;        // % — jumlah ketiganya = 100
  sideways: number;
  down: number;
  horizonDays: 7;    // horizon analisis: 7 hari
  drivers: ScoreDriver[];   // alasan terukur, dipakai LLM
}

export interface ScoreDriver {
  indicator: string;        // "RSI(14)"
  value: string;            // "71.3"
  direction: "up" | "down" | "neutral";
  weight: number;           // kontribusi poin
  note: string;             // "Overbought — historis rawan koreksi jangka pendek"
}

export interface AssetSnapshot {
  id: AssetId;
  name: string;
  symbol: string;
  priceIdr?: number;
  priceUsd?: number;
  change24hPct: number;
  change7dPct: number;
  spark30d: number[];       // harga harian 30 titik untuk chart
  indicators: Indicators;
  scenario: ScenarioProbabilities;
  updatedAt: string;        // ISO
  unavailable?: boolean;    // flag jika data provider gagal
}

export interface AssetAnalysis {
  id: AssetId;
  narrative: string;        // narasi ekonom (Bahasa Indonesia)
  generatedAt: string;
}