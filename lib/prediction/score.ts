import { Indicators, ScenarioProbabilities, ScoreDriver } from "./types";

export function calculateScenarioProbabilities(
  indicators: Indicators,
  change7dPct: number,
  isCrypto: boolean
): ScenarioProbabilities {
  const drivers: ScoreDriver[] = [];
  let totalScore = 0;

  // 1. RSI(14)
  const rsi = indicators.rsi14;
  let rsiScore = 0;
  let rsiNote = "";
  let rsiDir: "up" | "down" | "neutral" = "neutral";

  if (rsi < 30) {
    rsiScore = 25;
    rsiNote = `RSI(${rsi}) oversold — jenuh jual, secara kemungkinannya berpotensi pembalikan arah naik (rebound) jangka pendek`;
    rsiDir = "up";
  } else if (rsi >= 30 && rsi < 45) {
    rsiScore = 10;
    rsiNote = `RSI(${rsi}) mendekati area oversold — tekanan jual mulai jenuh, ada bias positif ringan`;
    rsiDir = "up";
  } else if (rsi >= 45 && rsi <= 55) {
    rsiScore = 0;
    rsiNote = `RSI(${rsi}) netral — momentum seimbang tanpa bias arah yang kuat`;
    rsiDir = "neutral";
  } else if (rsi > 55 && rsi <= 70) {
    rsiScore = -5;
    rsiNote = `RSI(${rsi}) cenderung overbought — momentum kenaikan melambat, bias negatif ringan`;
    rsiDir = "down";
  } else {
    // rsi > 70
    rsiScore = -25;
    rsiNote = `RSI(${rsi}) overbought — jenuh beli, rawan mengalami koreksi jangka pendek`;
    rsiDir = "down";
  }
  drivers.push({
    indicator: "RSI(14)",
    value: rsi.toString(),
    direction: rsiDir,
    weight: rsiScore,
    note: rsiNote
  });
  totalScore += rsiScore;

  // 2. MA Cross & Trend
  let maScore = 0;
  let maNote = "";
  let maDir: "up" | "down" | "neutral" = "neutral";

  if (indicators.maCross === "golden") {
    maScore = 25;
    maNote = "Golden Cross terdeteksi (SMA20 memotong ke atas SMA50) — kecenderungan pembalikan tren ke arah bullish";
    maDir = "up";
  } else if (indicators.maCross === "death") {
    maScore = -25;
    maNote = "Death Cross terdeteksi (SMA20 memotong ke bawah SMA50) — kecenderungan pembalikan tren ke arah bearish";
    maDir = "down";
  } else {
    // none, check alignment
    if (indicators.priceVsSma20Pct > 0 && indicators.sma20 > indicators.sma50) {
      maScore = 10;
      maNote = `Harga di atas SMA20 (${indicators.priceVsSma20Pct}%) dan SMA20 di atas SMA50 — tren kenaikan jangka menengah masih terjaga`;
      maDir = "up";
    } else if (indicators.priceVsSma20Pct < 0 && indicators.sma20 < indicators.sma50) {
      maScore = -10;
      maNote = `Harga di bawah SMA20 (${indicators.priceVsSma20Pct}%) and SMA20 di bawah SMA50 — tren penurunan jangka menengah masih mendominasi`;
      maDir = "down";
    } else {
      maScore = 0;
      maNote = `Garis SMA20 dan SMA50 saling mendekat — harga cenderung bergerak sideways`;
      maDir = "neutral";
    }
  }
  drivers.push({
    indicator: "Moving Average Cross & Trend",
    value: indicators.maCross === "none" ? (indicators.priceVsSma20Pct > 0 ? "Bullish Align" : "Bearish Align") : indicators.maCross,
    direction: maDir,
    weight: maScore,
    note: maNote
  });
  totalScore += maScore;

  // 3. MACD
  let macdScore = 0;
  let macdNote = "";
  let macdDir: "up" | "down" | "neutral" = "neutral";
  const m = indicators.macd;

  if (m.histogram > 0) {
    if (m.line > m.signal) {
      macdScore = 20;
      macdNote = `MACD Histogram positif (${m.histogram}) dan naik — momentum bullish sedang kuat mendukung tren naik`;
      macdDir = "up";
    } else {
      macdScore = 5;
      macdNote = `MACD Histogram positif (${m.histogram}) tapi melambat — momentum bullish mulai berkurang, ada potensi konsolidasi`;
      macdDir = "up";
    }
  } else {
    // histogram <= 0
    if (m.line < m.signal) {
      macdScore = -20;
      macdNote = `MACD Histogram negatif (${m.histogram}) dan menurun — tekanan bearish masih kuat mendorong harga ke bawah`;
      macdDir = "down";
    } else {
      macdScore = -5;
      macdNote = `MACD Histogram negatif (${m.histogram}) tapi melambat — tekanan bearish mulai berkurang, ada upaya akumulasi`;
      macdDir = "down";
    }
  }
  drivers.push({
    indicator: "MACD Momentum",
    value: `Hist: ${m.histogram}`,
    direction: macdDir,
    weight: macdScore,
    note: macdNote
  });
  totalScore += macdScore;

  // 4. Volume (kripto saja)
  if (isCrypto) {
    let volScore = 0;
    let volNote = "";
    let volDir: "up" | "down" | "neutral" = "neutral";
    const volChange = indicators.volumeChangePct;

    if (volChange > 30) {
      volScore = m.histogram >= 0 ? 10 : -10;
      volDir = m.histogram >= 0 ? "up" : "down";
      volNote = `Volume perdagangan melonjak signifikan (${volChange}% vs rata-rata 7 hari) — memperkuat kekuatan tren ${m.histogram >= 0 ? "bullish" : "bearish"} saat ini`;
    } else if (volChange < -30) {
      volScore = m.histogram >= 0 ? -10 : 10;
      volDir = "neutral";
      volNote = `Volume perdagangan menyusut drastis (${volChange}% vs rata-rata 7 hari) — minat pasar rendah, memicu pergerakan sideways`;
    } else {
      volScore = 0;
      volDir = "neutral";
      volNote = `Volume perdagangan stabil (${volChange}% vs rata-rata 7 hari) — aktivitas pasar normal mendukung pergerakan saat ini`;
    }
    
    drivers.push({
      indicator: "Volume Perdagangan",
      value: `${volChange}%`,
      direction: volDir,
      weight: volScore,
      note: volNote
    });
    totalScore += volScore;
  }

  // 5. Fear & Greed Index (kripto saja)
  if (isCrypto && indicators.fearGreed !== undefined) {
    let fgScore = 0;
    let fgNote = "";
    let fgDir: "up" | "down" | "neutral" = "neutral";
    const fg = indicators.fearGreed;

    if (fg < 25) {
      fgScore = 10;
      fgNote = `Indeks Fear & Greed (${fg}) Extreme Fear — secara contrarian, sentimen ketakutan ekstrem sering kali menjadi zona akumulasi dasar`;
      fgDir = "up";
    } else if (fg >= 25 && fg < 45) {
      fgScore = 5;
      fgNote = `Indeks Fear & Greed (${fg}) Fear — sentimen pasar khawatir, menawarkan diskon harga yang wajar bagi pembeli jangka menengah`;
      fgDir = "up";
    } else if (fg >= 45 && fg <= 55) {
      fgScore = 0;
      fgNote = `Indeks Fear & Greed (${fg}) Neutral — sentimen pelaku pasar stabil tanpa kepanikan maupun keserakahan`;
      fgDir = "neutral";
    } else if (fg > 55 && fg <= 75) {
      fgScore = -5;
      fgNote = `Indeks Fear & Greed (${fg}) Greed — sentimen pasar serakah, diimbangi dengan kehati-hatian terhadap potensi jenuh beli`;
      fgDir = "down";
    } else {
      // fg > 75
      fgScore = -10;
      fgNote = `Indeks Fear & Greed (${fg}) Extreme Greed — euforia pasar tinggi, rawan memicu aksi koreksi mendadak`;
      fgDir = "down";
    }
    drivers.push({
      indicator: "Sentimen Fear & Greed",
      value: fg.toString(),
      direction: fgDir,
      weight: fgScore,
      note: fgNote
    });
    totalScore += fgScore;
  }

  // 6. Momentum 7d
  let momScore = Math.round(change7dPct * 1.5);
  momScore = Math.max(-10, Math.min(10, momScore));
  let momNote = "";
  let momDir: "up" | "down" | "neutral" = "neutral";

  if (momScore > 2) {
    momNote = `Perubahan harga 7 hari positif (${change7dPct.toFixed(1)}%) — momentum jangka pendek cenderung mendukung kelanjutan tren naik`;
    momDir = "up";
  } else if (momScore < -2) {
    momNote = `Perubahan harga 7 hari negatif (${change7dPct.toFixed(1)}%) — momentum jangka pendek mengarah pada kelanjutan tren turun`;
    momDir = "down";
  } else {
    momNote = `Perubahan harga 7 hari stabil (${change7dPct.toFixed(1)}%) — fluktuasi harga sempit mencerminkan konsolidasi harga`;
    momDir = "neutral";
  }
  drivers.push({
    indicator: "Momentum Harga 7 Hari",
    value: `${change7dPct.toFixed(1)}%`,
    direction: momDir,
    weight: momScore,
    note: momNote
  });
  totalScore += momScore;

  // CONVERT SCORE TO PROBABILITIES
  const clampedTotalScore = Math.max(-100, Math.min(100, totalScore));

  let pUp = 33.3 + clampedTotalScore * 0.30;
  let pDown = 33.3 - clampedTotalScore * 0.30;
  let pSideways = 100 - pUp - pDown;

  const MIN_PROB = 8;
  let extraNeeded = 0;
  
  if (pUp < MIN_PROB) {
    extraNeeded += MIN_PROB - pUp;
    pUp = MIN_PROB;
  }
  if (pDown < MIN_PROB) {
    extraNeeded += MIN_PROB - pDown;
    pDown = MIN_PROB;
  }
  if (pSideways < MIN_PROB) {
    extraNeeded += MIN_PROB - pSideways;
    pSideways = MIN_PROB;
  }

  if (extraNeeded > 0) {
    const activeScenarios = [
      { key: "up", val: pUp },
      { key: "down", val: pDown },
      { key: "sideways", val: pSideways }
    ].filter(x => x.val > MIN_PROB);

    const sumActive = activeScenarios.reduce((acc, curr) => acc + curr.val, 0);
    
    for (const sc of activeScenarios) {
      const deduction = (sc.val / sumActive) * extraNeeded;
      if (sc.key === "up") pUp -= deduction;
      if (sc.key === "down") pDown -= deduction;
      if (sc.key === "sideways") pSideways -= deduction;
    }
  }

  const MAX_PROB = 75;
  if (pUp > MAX_PROB) {
    const diff = pUp - MAX_PROB;
    pUp = MAX_PROB;
    pSideways += diff / 2;
    pDown += diff / 2;
  }
  if (pDown > MAX_PROB) {
    const diff = pDown - MAX_PROB;
    pDown = MAX_PROB;
    pSideways += diff / 2;
    pUp += diff / 2;
  }

  let roundedUp = Math.round(pUp);
  let roundedDown = Math.round(pDown);
  let roundedSideways = 100 - roundedUp - roundedDown;

  if (roundedSideways < MIN_PROB) {
    const diff = MIN_PROB - roundedSideways;
    roundedSideways = MIN_PROB;
    if (roundedUp > roundedDown) {
      roundedUp -= diff;
    } else {
      roundedDown -= diff;
    }
  }

  return {
    up: roundedUp,
    sideways: roundedSideways,
    down: roundedDown,
    horizonDays: 7,
    drivers
  };
}