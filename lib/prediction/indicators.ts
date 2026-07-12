import { Indicators } from "./types";

export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(0);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ema.push(0);
      if (i < period) sum += prices[i];
    } else if (i === period - 1) {
      sum += prices[i];
      ema.push(sum / period);
    } else {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
  }
  return ema;
}

export function calculateMACD(prices: number[]): { line: number[]; signal: number[]; histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const line: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < 25) {
      line.push(0);
    } else {
      line.push(ema12[i] - ema26[i]);
    }
  }
  
  const signal: number[] = [];
  const k = 2 / (9 + 1);
  let macdSum = 0;
  
  for (let i = 0; i < line.length; i++) {
    if (i < 25) {
      signal.push(0);
    } else if (i < 25 + 8) {
      signal.push(0);
      macdSum += line[i];
    } else if (i === 25 + 8) {
      macdSum += line[i];
      signal.push(macdSum / 9);
    } else {
      signal.push(line[i] * k + signal[i - 1] * (1 - k));
    }
  }
  
  const histogram: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < 25 + 8) {
      histogram.push(0);
    } else {
      histogram.push(line[i] - signal[i]);
    }
  }
  
  return { line, signal, histogram };
}

export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (prices.length < period + 1) {
    return new Array(prices.length).fill(50);
  }
  
  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }
  
  let totalGain = 0;
  let totalLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      totalGain += diff;
    } else {
      totalLoss += Math.abs(diff);
    }
  }
  
  let avgGain = totalGain / period;
  let avgLoss = totalLoss / period;
  rsi.push(avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss));
  
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
    
    rsi.push(avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss));
  }
  
  return rsi;
}

export function detectMACross(sma20: number[], sma50: number[]): "golden" | "death" | "none" {
  const len = sma20.length;
  if (len < 6) return "none";
  
  for (let i = 0; i < 5; i++) {
    const currIdx = len - 1 - i;
    const prevIdx = currIdx - 1;
    if (prevIdx < 0) break;
    
    if (sma20[prevIdx] <= sma50[prevIdx] && sma20[currIdx] > sma50[currIdx]) {
      return "golden";
    }
    if (sma20[prevIdx] >= sma50[prevIdx] && sma20[currIdx] < sma50[currIdx]) {
      return "death";
    }
  }
  
  return "none";
}

export function calculateIndicators(prices: number[], volumes: number[], fearGreed?: number): Indicators {
  const len = prices.length;
  if (len === 0) {
    return {
      rsi14: 50,
      sma20: 0,
      sma50: 0,
      maCross: "none",
      macd: { line: 0, signal: 0, histogram: 0, state: "bearish" },
      volumeChangePct: 0,
      fearGreed,
      priceVsSma20Pct: 0,
    };
  }

  const rsiArray = calculateRSI(prices, 14);
  const sma20Array = calculateSMA(prices, 20);
  const sma50Array = calculateSMA(prices, 50);
  const macdData = calculateMACD(prices);

  const rsi14 = rsiArray[len - 1] !== undefined ? Math.round(rsiArray[len - 1] * 10) / 10 : 50;
  const sma20 = sma20Array[len - 1] !== undefined ? Math.round(sma20Array[len - 1] * 100) / 100 : 0;
  const sma50 = sma50Array[len - 1] !== undefined ? Math.round(sma50Array[len - 1] * 100) / 100 : 0;
  const maCross = detectMACross(sma20Array, sma50Array);

  const macdLineVal = macdData.line[len - 1] !== undefined ? macdData.line[len - 1] : 0;
  const macdSignalVal = macdData.signal[len - 1] !== undefined ? macdData.signal[len - 1] : 0;
  const macdHistVal = macdData.histogram[len - 1] !== undefined ? macdData.histogram[len - 1] : 0;
  const macdState = macdHistVal >= 0 ? "bullish" : "bearish";

  let volumeChangePct = 0;
  if (volumes.length >= 8) {
    const lastVolume = volumes[volumes.length - 1];
    let sumPrevVolumes = 0;
    for (let i = 2; i <= 8; i++) {
      sumPrevVolumes += volumes[volumes.length - i];
    }
    const avgPrevVolume = sumPrevVolumes / 7;
    volumeChangePct = avgPrevVolume === 0 ? 0 : ((lastVolume - avgPrevVolume) / avgPrevVolume) * 100;
  }
  volumeChangePct = Math.round(volumeChangePct * 10) / 10;

  const lastPrice = prices[len - 1] || 0;
  const priceVsSma20Pct = sma20 === 0 ? 0 : Math.round(((lastPrice - sma20) / sma20) * 100 * 10) / 10;

  return {
    rsi14,
    sma20,
    sma50,
    maCross,
    macd: {
      line: Math.round(macdLineVal * 100) / 100,
      signal: Math.round(macdSignalVal * 100) / 100,
      histogram: Math.round(macdHistVal * 100) / 100,
      state: macdState,
    },
    volumeChangePct,
    fearGreed,
    priceVsSma20Pct,
  };
}