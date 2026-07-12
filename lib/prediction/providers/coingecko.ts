export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
}

export interface CoinGeckoChartData {
  prices: [number, number][]; // [timestamp, price]
  total_volumes: [number, number][]; // [timestamp, volume]
}

export async function fetchCoinGeckoMarkets(): Promise<CoinGeckoMarketData[]> {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&ids=bitcoin,ethereum,solana,binancecoin&price_change_percentage=24h,7d";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 } // Cache NextJS 10 menit
    });
    
    if (!res.ok) {
      throw new Error(`CoinGecko API returned status ${res.status}`);
    }
    
    return await res.json();
  } catch (err: unknown) {
    console.error("fetchCoinGeckoMarkets error:", (err as Error).message || String(err));
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCoinGeckoChart(assetId: string): Promise<CoinGeckoChartData> {
  const url = `https://api.coingecko.com/api/v3/coins/${assetId}/market_chart?vs_currency=idr&days=60&interval=daily`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 }
    });
    
    if (!res.ok) {
      throw new Error(`CoinGecko Chart API for ${assetId} returned status ${res.status}`);
    }
    
    return await res.json();
  } catch (err: unknown) {
    console.error(`fetchCoinGeckoChart for ${assetId} error:`, (err as Error).message || String(err));
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}