export interface YahooStockData {
  symbol: string;
  price: number;
  change24hPct: number;
  change7dPct: number;
  spark30d: number[];
  prices60d: number[];
}

export const YAHOO_TICKERS: Record<string, string> = {
  bbca: "BBCA.JK",
  bbri: "BBRI.JK",
  tlkm: "TLKM.JK",
  asii: "ASII.JK",
  adro: "ADRO.JK"
};

export async function fetchYahooStock(ticker: string): Promise<YahooStockData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=60d&interval=1d`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 } // Cache 10 menit
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance API returned status ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart.result[0];
    if (!result) {
      throw new Error(`Empty chart result for ${ticker}`);
    }

    const prices = result.indicators.quote[0].close;
    // Saring data null/undefined dari Yahoo Finance
    const validPrices: number[] = prices.filter((p: number | null) => p !== null && p !== undefined);

    if (validPrices.length < 15) {
      throw new Error(`Insufficient price points for ${ticker}: ${validPrices.length}`);
    }

    const finalPrices = validPrices.slice(-60);
    const len = finalPrices.length;

    // Ambal regularMarketPrice dari metadata atau dari data penutupan terakhir
    const price = result.meta.regularMarketPrice || finalPrices[len - 1];

    let change24hPct = 0;
    if (len >= 2) {
      change24hPct = ((finalPrices[len - 1] - finalPrices[len - 2]) / finalPrices[len - 2]) * 100;
    }

    let change7dPct = 0;
    if (len >= 8) {
      change7dPct = ((finalPrices[len - 1] - finalPrices[len - 8]) / finalPrices[len - 8]) * 100;
    }

    const spark30d = finalPrices.slice(-30);

    return {
      symbol: ticker,
      price,
      change24hPct,
      change7dPct,
      spark30d,
      prices60d: finalPrices
    };
  } catch (err: unknown) {
    console.error(`fetchYahooStock for ${ticker} error:`, (err as Error).message || String(err));
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}