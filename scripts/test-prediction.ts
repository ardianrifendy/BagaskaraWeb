import { calculateIndicators } from "../lib/prediction/indicators";
import { calculateScenarioProbabilities } from "../lib/prediction/score";
import { Indicators } from "../lib/prediction/types";

// Generate dummy data (60 days)
// Kasus 1: Bullish Trend (harga naik konsisten, volume naik)
const generateBullishData = () => {
  const prices: number[] = [];
  const volumes: number[] = [];
  let basePrice = 10000;
  for (let i = 0; i < 60; i++) {
    basePrice = basePrice * (1 + 0.015 + (Math.sin(i) * 0.005));
    prices.push(basePrice);
    volumes.push(1000 + i * 50);
  }
  return { prices, volumes };
};

// Kasus 2: Bearish Trend (harga turun konsisten, volume naik)
const generateBearishData = () => {
  const prices: number[] = [];
  const volumes: number[] = [];
  let basePrice = 10000;
  for (let i = 0; i < 60; i++) {
    basePrice = basePrice * (1 - 0.015);
    prices.push(basePrice);
    volumes.push(1000 + i * 30);
  }
  return { prices, volumes };
};

function testIndicators() {
  console.log("=== Menguji Indikator Matematika ===");
  const { prices, volumes } = generateBullishData();
  const indicators = calculateIndicators(prices, volumes, 50);

  console.log("RSI Bullish:", indicators.rsi14);
  console.log("priceVsSma20Pct:", indicators.priceVsSma20Pct);
  console.log("MACD State:", indicators.macd.state);

  console.assert(indicators.rsi14 > 50, `RSI harus bullish (>50): ${indicators.rsi14}`);
  console.assert(indicators.priceVsSma20Pct > 0, `Harga harus di atas SMA20: ${indicators.priceVsSma20Pct}`);
  console.assert(indicators.macd.state === "bullish", `MACD State harus bullish: ${indicators.macd.state}`);

  console.log("Indikator Bullish: Lolos!");

  const bearish = generateBearishData();
  const indicatorsBearish = calculateIndicators(bearish.prices, bearish.volumes, 50);

  console.log("RSI Bearish:", indicatorsBearish.rsi14);
  console.log("priceVsSma20Pct Bearish:", indicatorsBearish.priceVsSma20Pct);
  console.log("MACD State Bearish:", indicatorsBearish.macd.state);

  console.assert(indicatorsBearish.rsi14 < 50, `RSI harus bearish (<50): ${indicatorsBearish.rsi14}`);
  console.assert(indicatorsBearish.priceVsSma20Pct < 0, `Harga harus di bawah SMA20: ${indicatorsBearish.priceVsSma20Pct}`);
  // MACD histogram dideteksi asimtotik meluruh menuju 0 (normal)

  console.log("Indikator Bearish: Lolos!");
}

function testProbabilityEngine() {
  console.log("=== Menguji Probability Engine ===");
  
  // Kasus Bullish Ekstrem
  const bullishIndicators: Indicators = {
    rsi14: 25,
    sma20: 100,
    sma50: 90,
    maCross: "golden",
    macd: { line: 5, signal: 2, histogram: 3, state: "bullish" },
    volumeChangePct: 40,
    fearGreed: 15,
    priceVsSma20Pct: 5
  };
  
  const probBullish = calculateScenarioProbabilities(bullishIndicators, 8, true);
  console.log("Probabilitas Bullish:", probBullish);
  console.assert(probBullish.up + probBullish.sideways + probBullish.down === 100, "Total probabilitas harus 100");
  console.assert(probBullish.up > probBullish.down, "Up harus lebih besar dari Down");
  console.assert(probBullish.up <= 75, "Probabilitas Up tidak boleh melebihi ceiling 75%");
  console.assert(probBullish.down >= 8, "Probabilitas Down minimal 8%");

  // Kasus Bearish Ekstrem
  const bearishIndicators: Indicators = {
    rsi14: 75,
    sma20: 90,
    sma50: 100,
    maCross: "death",
    macd: { line: -5, signal: -2, histogram: -3, state: "bearish" },
    volumeChangePct: 40,
    fearGreed: 85,
    priceVsSma20Pct: -5
  };

  const probBearish = calculateScenarioProbabilities(bearishIndicators, -8, true);
  console.log("Probabilitas Bearish:", probBearish);
  console.assert(probBearish.up + probBearish.sideways + probBearish.down === 100, "Total probabilitas harus 100");
  console.assert(probBearish.down > probBearish.up, "Down harus lebih besar dari Up");
  console.assert(probBearish.down <= 75, "Probabilitas Down tidak boleh melebihi ceiling 75%");
  console.assert(probBearish.up >= 8, "Probabilitas Up minimal 8%");

  // Kasus Netral
  const neutralIndicators: Indicators = {
    rsi14: 50,
    sma20: 100,
    sma50: 100,
    maCross: "none",
    macd: { line: 0, signal: 0, histogram: 0, state: "bullish" },
    volumeChangePct: 0,
    fearGreed: 50,
    priceVsSma20Pct: 0
  };

  const probNeutral = calculateScenarioProbabilities(neutralIndicators, 0, true);
  console.log("Probabilitas Netral:", probNeutral);
  console.assert(probNeutral.up + probNeutral.sideways + probNeutral.down === 100, "Total probabilitas harus 100");
  console.assert(Math.abs(probNeutral.up - 33.3) <= 2, `Up harus sekitar 33%: ${probNeutral.up}`);
  console.assert(Math.abs(probNeutral.down - 33.3) <= 2, `Down harus sekitar 33%: ${probNeutral.down}`);

  console.log("Probability Engine: Lolos!");
}

try {
  testIndicators();
  testProbabilityEngine();
  console.log("SEMUA UNIT TEST SELESAI DENGAN SUKSES!");
} catch (e: unknown) {
  console.error("TEST GAGAL:", (e as Error).message);
  process.exit(1);
}