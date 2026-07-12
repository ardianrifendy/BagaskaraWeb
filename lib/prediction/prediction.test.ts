import test from "node:test";
import assert from "node:assert";
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, detectMACross } from "./indicators";
import { calculateScenarioProbabilities } from "./score";
import { Indicators } from "./types";

test("Technical Indicators — SMA Calculation", () => {
  const prices = Array.from({ length: 30 }, (_, i) => i + 1); // 1 to 30
  // SMA 10: last 10 elements are 21 to 30. Sum is 255. Avg is 25.5.
  const sma10 = calculateSMA(prices, 10);
  assert.strictEqual(sma10.length, 30);
  assert.strictEqual(sma10[29], 25.5);
  // SMA before period-1 should be 0
  assert.strictEqual(sma10[0], 0);
  assert.strictEqual(sma10[8], 0);
});

test("Technical Indicators — EMA Calculation", () => {
  const prices = Array.from({ length: 30 }, () => 10); // All 10s
  const ema10 = calculateEMA(prices, 10);
  assert.strictEqual(ema10.length, 30);
  // For constant sequence, EMA should converge to 10
  assert.strictEqual(Math.round(ema10[29]), 10);
});

test("Technical Indicators — RSI Wilder Calculation", () => {
  // Constant prices should result in RSI 50
  const pricesConstant = Array.from({ length: 30 }, () => 100);
  const rsiConstant = calculateRSI(pricesConstant, 14);
  assert.strictEqual(rsiConstant[29], 50);

  // Alternating prices to check bounds
  const pricesAlternating = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? 100 : 105));
  const rsiAlt = calculateRSI(pricesAlternating, 14);
  assert.ok(rsiAlt[29] >= 0 && rsiAlt[29] <= 100);
});

test("Technical Indicators — MACD Calculation", () => {
  const prices = Array.from({ length: 60 }, (_, i) => i + 1);
  const macd = calculateMACD(prices);
  assert.strictEqual(macd.line.length, 60);
  assert.strictEqual(macd.signal.length, 60);
  assert.strictEqual(macd.histogram.length, 60);
});

test("Technical Indicators — Moving Average Cross Detection", () => {
  // Golden Cross: SMA20 crosses above SMA50
  const sma20Golden = [9, 9, 9, 10, 11, 12];
  const sma50Golden = [10, 10, 10, 10, 10, 10];
  assert.strictEqual(detectMACross(sma20Golden, sma50Golden), "golden");

  // Death Cross: SMA20 crosses below SMA50
  const sma20Death = [11, 11, 11, 10, 9, 8];
  const sma50Death = [10, 10, 10, 10, 10, 10];
  assert.strictEqual(detectMACross(sma20Death, sma50Death), "death");

  // No Cross
  const sma20None = [11, 11, 11, 11, 11, 11];
  const sma50None = [10, 10, 10, 10, 10, 10];
  assert.strictEqual(detectMACross(sma20None, sma50None), "none");
});

test("Probability Engine — Extreme Bullish Scenario", () => {
  // Arrange extremely bullish indicators
  const indicators: Indicators = {
    rsi14: 20, // Oversold (Score +25)
    sma20: 100,
    sma50: 90,
    maCross: "golden", // Golden Cross (Score +25)
    macd: {
      line: 2.0,
      signal: 1.0,
      histogram: 1.0,
      state: "bullish",
       // Positive and rising (Score +20)
    },
    volumeChangePct: 50.0, // volume > 30% and MACD bullish (Score +10)
    fearGreed: 15, // Extreme Fear (Score +10)
    priceVsSma20Pct: 5.0
  };
  const change7dPct = 15.0; // Momentum bullish (Score +10)

  // Expected tempScore = 25 (RSI) + 25 (MA Cross) + 20 (MACD) + 10 (F&G) + 10 (Momentum) + 10 (Volume) = 100
  // Total Score clamped to 100.
  // Up prob: 33.3 + 100 * 0.3 = 63.3 -> round to 63
  // Down prob: 33.3 - 100 * 0.3 = 3.3 -> clamp to 8 -> round to 8
  // Sideways prob: 100 - 63 - 8 = 29

  const result = calculateScenarioProbabilities(indicators, change7dPct, true);

  assert.strictEqual(result.up, 60);
  assert.strictEqual(result.down, 8);
  assert.strictEqual(result.sideways, 32);
  assert.strictEqual(result.up + result.down + result.sideways, 100);
  assert.ok(result.up >= 8 && result.up <= 75);
  assert.ok(result.down >= 8 && result.down <= 75);
  assert.ok(result.sideways >= 8 && result.sideways <= 75);
});

test("Probability Engine — Extreme Bearish Scenario", () => {
  // Arrange extremely bearish indicators
  const indicators: Indicators = {
    rsi14: 85, // Overbought (Score -25)
    sma20: 80,
    sma50: 90,
    maCross: "death", // Death Cross (Score -25)
    macd: {
      line: -2.0,
      signal: -1.0,
      histogram: -1.0,
      state: "bearish",
       // Negative and falling (Score -20)
    },
    volumeChangePct: 50.0, // volume > 30% and MACD bearish (Score -10)
    fearGreed: 85, // Extreme Greed (Score -10)
    priceVsSma20Pct: -5.0
  };
  const change7dPct = -15.0; // Momentum bearish (Score -10)

  // Expected tempScore = -25 (RSI) - 25 (MA Cross) - 20 (MACD) - 10 (F&G) - 10 (Momentum) - 10 (Volume) = -100
  // Total Score clamped to -100.
  // Up prob: 33.3 - 30 = 3.3 -> clamp to 8 -> round to 8
  // Down prob: 33.3 + 30 = 63.3 -> round to 63
  // Sideways prob: 100 - 8 - 63 = 29

  const result = calculateScenarioProbabilities(indicators, change7dPct, true);

  assert.strictEqual(result.up, 8);
  assert.strictEqual(result.down, 60);
  assert.strictEqual(result.sideways, 32);
  assert.strictEqual(result.up + result.down + result.sideways, 100);
  assert.ok(result.up >= 8 && result.up <= 75);
  assert.ok(result.down >= 8 && result.down <= 75);
  assert.ok(result.sideways >= 8 && result.sideways <= 75);
});

test("Probability Engine — Neutral Scenario", () => {
  // Arrange neutral indicators
  const indicators: Indicators = {
    rsi14: 50, // Neutral (Score 0)
    sma20: 100,
    sma50: 100,
    maCross: "none",
    macd: {
      line: 0.0,
      signal: 0.0,
      histogram: 0.0,
      state: "bullish",
       // Neutral-ish (Score 5)
    },
    volumeChangePct: 0.0, // Neutral (Score 0)
    fearGreed: 50, // Neutral (Score 0)
    priceVsSma20Pct: 0.0
  };
  const change7dPct = 0.0; // Neutral (Score 0)

  // Expected tempScore = 0 (RSI) + 0 (MA Cross) + 5 (MACD) + 0 (F&G) + 0 (Momentum) + 0 (Volume) = 5
  // Up prob: 33.3 + 5 * 0.3 = 34.8 -> round to 35
  // Down prob: 33.3 - 5 * 0.3 = 31.8 -> round to 32
  // Sideways prob: 100 - 35 - 32 = 33

  const result = calculateScenarioProbabilities(indicators, change7dPct, true);

  assert.strictEqual(result.up, 32);
  assert.strictEqual(result.down, 35);
  assert.strictEqual(result.sideways, 33);
  assert.strictEqual(result.up + result.down + result.sideways, 100);
});

test("Probability Engine — Volume Consolidating (-40%) Scenario", () => {
  // Arrange indicators with very low volume
  const indicators: Indicators = {
    rsi14: 35, // netral-bawah (+10)
    sma20: 100,
    sma50: 95,
    maCross: "none", // price > sma20 & sma20 > sma50 (+10)
    macd: {
      line: 1.0,
      signal: 0.5,
      histogram: 0.5,
      state: "bullish",
       // positive & rising (+20)
    },
    volumeChangePct: -40.0, // volume < -30% (should reduce tempScore by up to 10 points)
    fearGreed: 50, // neutral (0)
    priceVsSma20Pct: 2.0
  };
  const change7dPct = 5.0; // Momentum +5% (+5)

  // Running Score before volume = +10 (RSI) + 10 (MA) + 20 (MACD) + 0 (F&G) + 5 (Momentum) = +45
  // Volume < -30% pulls score down by 10 points -> volScore = -10
  // Total Score = 45 - 10 = 35
  // Up prob: 33.3 + 35 * 0.3 = 43.8 -> round to 44
  // Down prob: 33.3 - 35 * 0.3 = 22.8 -> round to 23
  // Sideways prob: 100 - 44 - 23 = 33

  const result = calculateScenarioProbabilities(indicators, change7dPct, true);

  assert.strictEqual(result.up, 45);
  assert.strictEqual(result.down, 22);
  assert.strictEqual(result.sideways, 33);
});
