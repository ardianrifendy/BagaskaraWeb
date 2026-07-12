export async function fetchFearGreedIndex(): Promise<number> {
  const url = "https://api.alternative.me/fng/?limit=1";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache 1 jam
    });

    if (!res.ok) {
      throw new Error(`Fear & Greed Index API returned status ${res.status}`);
    }

    const data = await res.json();
    return parseInt(data.data[0].value) || 50;
  } catch (err: unknown) {
    console.error("fetchFearGreedIndex error:", (err as Error).message || String(err));
    return 50; // default netral
  } finally {
    clearTimeout(timeoutId);
  }
}