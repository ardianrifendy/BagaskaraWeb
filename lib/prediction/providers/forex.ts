export async function fetchUSDIDRForex(): Promise<{
  price: number;
  change24hPct: number;
  change7dPct: number;
  spark30d: number[];
  prices60d: number[];
}> {
  const latestUrl = "https://api.frankfurter.app/latest?from=USD&to=IDR";
  
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 75); // 75 hari agar mendapatkan minimal 60 data perdagangan
  
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const historyUrl = `https://api.frankfurter.app/${formatDate(start)}..${formatDate(end)}?from=USD&to=IDR`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const [latestRes, historyRes] = await Promise.all([
      fetch(latestUrl, { signal: controller.signal, next: { revalidate: 600 } }),
      fetch(historyUrl, { signal: controller.signal, next: { revalidate: 600 } })
    ]);

    if (!latestRes.ok || !historyRes.ok) {
      throw new Error("Frankfurter Forex API error");
    }

    const latestData = await latestRes.json();
    const historyData = await historyRes.json();

    const price = latestData.rates.IDR;
    
    const dates = Object.keys(historyData.rates).sort();
    const prices60d = dates.map(d => historyData.rates[d].IDR as number);

    const finalPrices = prices60d.slice(-60);
    const len = finalPrices.length;

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
      price,
      change24hPct,
      change7dPct,
      spark30d,
      prices60d: finalPrices
    };
  } catch (err: unknown) {
    console.error("fetchUSDIDRForex error:", (err as Error).message || String(err));
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}