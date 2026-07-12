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

export interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
}

// Daftar Lokal 100 Koin Kripto Terpopuler untuk pencarian lokal instan
export const TOP_100_CRYPTOS: CryptoInfo[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "polygon", symbol: "MATIC", name: "Polygon" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol" },
  { id: "pepe", symbol: "PEPE", name: "Pepe" },
  { id: "sui", symbol: "SUI", name: "Sui" },
  { id: "aptos", symbol: "APT", name: "Aptos" },
  { id: "stellar", symbol: "XLM", name: "Stellar" },
  { id: "okb", symbol: "OKB", name: "OKB" },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos" },
  { id: "ethereum-classic", symbol: "ETC", name: "Ethereum Classic" },
  { id: "render-token", symbol: "RNDR", name: "Render" },
  { id: "filecoin", symbol: "FIL", name: "Filecoin" },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum" },
  { id: "optimism", symbol: "OP", name: "Optimism" },
  { id: "kaspa", symbol: "KAS", name: "Kaspa" },
  { id: "fantom", symbol: "FTM", name: "Fantom" },
  { id: "dogwifhat", symbol: "WIF", name: "dogwifhat" },
  { id: "bonk", symbol: "BONK", name: "Bonk" },
  { id: "lido-dao", symbol: "LDO", name: "Lido DAO" },
  { id: "hedera-hashgraph", symbol: "HBAR", name: "Hedera" },
  { id: "vechain", symbol: "VET", name: "VeChain" },
  { id: "maker", symbol: "MKR", name: "Maker" },
  { id: "floki", symbol: "FLOKI", name: "Floki" },
  { id: "thorchain", symbol: "RUNE", name: "THORChain" },
  { id: "graph", symbol: "GRT", name: "The Graph" },
  { id: "aave", symbol: "AAVE", name: "Aave" },
  { id: "theta-token", symbol: "THETA", name: "Theta Network" },
  { id: "algorand", symbol: "ALGO", name: "Algorand" },
  { id: "flow", symbol: "FLOW", name: "Flow" },
  { id: "monero", symbol: "XMR", name: "Monero" },
  { id: "fbtc", symbol: "FBTC", name: "FBTC" },
  { id: "arweave", symbol: "AR", name: "Arweave" },
  { id: "quant-network", symbol: "QNT", name: "Quant" },
  { id: "elrond-erd-2", symbol: "EGLD", name: "MultiversX" },
  { id: "eos", symbol: "EOS", name: "EOS" },
  { id: "tezos", symbol: "XTZ", name: "Tezos" },
  { id: "decentraland", symbol: "MANA", name: "Decentraland" },
  { id: "the-sandbox", symbol: "SAND", name: "The Sandbox" },
  { id: "axie-infinity", symbol: "AXS", name: "Axie Infinity" },
  { id: "gala", symbol: "GALA", name: "Gala" },
  { id: "chiliz", symbol: "CHZ", name: "Chiliz" },
  { id: "neo", symbol: "NEO", name: "NEO" },
  { id: "iota", symbol: "IOTA", name: "IOTA" },
  { id: "kava", symbol: "KAVA", name: "Kava" },
  { id: "mina-protocol", symbol: "MINA", name: "Mina" },
  { id: "zcash", symbol: "ZEC", name: "Zcash" },
  { id: "dash", symbol: "DASH", name: "Dash" },
  { id: "compound-governance-token", symbol: "COMP", name: "Compound" },
  { id: "synthetix-network-token", symbol: "SNX", name: "Synthetix" },
  { id: "dydx-chain", symbol: "DYDX", name: "dYdX" },
  { id: "curve-dao-token", symbol: "CRV", name: "Curve DAO" },
  { id: "1inch", symbol: "1INCH", name: "1inch" },
  { id: "enjincoin", symbol: "ENJ", name: "Enjin Coin" },
  { id: "weth", symbol: "WETH", name: "WETH" },
  { id: "zilliqa", symbol: "ZIL", name: "Zilliqa" },
  { id: "bat", symbol: "BAT", name: "Basic Attention Token" },
  { id: "loopring", symbol: "LRC", name: "Loopring" },
  { id: "yearn-finance", symbol: "YFI", name: "yearn.finance" },
  { id: "qtum", symbol: "QTUM", name: "Qtum" },
  { id: "0x", symbol: "ZRX", name: "0x" },
  { id: "bancor", symbol: "BNT", name: "Bancor" },
  { id: "omg", symbol: "OMG", name: "OMG Network" },
  { id: "sushi", symbol: "SUSHI", name: "Sushiswap" },
  { id: "icon", symbol: "ICX", name: "ICON" },
  { id: "ontology", symbol: "ONT", name: "Ontology" },
  { id: "waves", symbol: "WAVES", name: "Waves" },
  { id: "dogelon-mars", symbol: "ELON", name: "Dogelon Mars" },
  { id: "ravencoin", symbol: "RVN", name: "Ravencoin" },
  { id: "siacoin", symbol: "SC", name: "Siacoin" },
  { id: "audius", symbol: "AUDIO", name: "Audius" },
  { id: "golem", symbol: "GLM", name: "Golem" },
  { id: "livepeer", symbol: "LPT", name: "Livepeer" },
  { id: "lisk", symbol: "LSK", name: "Lisk" },
  { id: "syscoin", symbol: "SYS", name: "Syscoin" },
  { id: "pax-gold", symbol: "PAXG", name: "PAX Gold" }
];

export async function fetchCoinGeckoMarkets(customIds?: string): Promise<CoinGeckoMarketData[]> {
  const ids = customIds || "bitcoin,ethereum,solana,binancecoin";
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&ids=${ids}&price_change_percentage=24h,7d`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 } // Cache 10 menit
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