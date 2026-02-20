/**
 * Pyth Network Price Feed Service
 * Fetches real-time crypto price data from Pyth Network
 * Supports: BTC, SUI, SOL, AND CUSTOM TOKENS (BYNOMO)
 */

import { HermesClient } from '@pythnetwork/hermes-client';

// Pyth Network Price Feed IDs (Stable/Mainnet)
export const PRICE_FEED_IDS = {
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  SUI: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  TRX: '0x67aed5a24fdad045475e7195c98a98aea119c763f272d4523f5bac93a4f33c2b',
  XRP: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
  DOGE: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  ADA: '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  BCH: '0x3dd2b63686a450ec7290df3a1e0b583c0481f651351edfa7636f39aed55cf8a3',
  BNB: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  XLM: '0xb7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850',
  XTZ: '0x0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03',
  NEAR: '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  // Metals
  GOLD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  SILVER: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
  // FX
  EUR: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  GBP: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
  JPY: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52',
  AUD: '0x67a6f93030420c1c9e3fe37c1ab6b77966af82f995944a9fefce357a22854a80',
  CAD: '0x3112b03a41c910ed446852aacf67118cb1bec67b2cd0b9a214c58cc0eaa2ecca',
  // Stocks
  AAPL: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  GOOGL: '0x5a48c03e9b9cb337801073ed9d166817473697efff0d138874e0f6a33d6d5aa6',
  AMZN: '0xb5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a',
  MSFT: '0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1',
  NVDA: '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
  TSLA: '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
  META: '0x78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe',
  NFLX: '0x8376cfd7ca8bcdf372ced05307b24dced1f15b1afafdeff715664598f15a3dd2',
} as const;

export const CUSTOM_TOKENS = {
  BYNOMO: 'Bi4NEEQhtrFdnoS9NjrXaWkQftXifh2t3RzQHSTQpump'
} as const;

export type AssetType = keyof typeof PRICE_FEED_IDS | keyof typeof CUSTOM_TOKENS;

// Pyth Hermes API endpoint (public, free to use)
const HERMES_ENDPOINT = 'https://hermes.pyth.network';

export interface PriceData {
  price: number;
  confidence: number;
  timestamp: number;
  expo: number;
}

export class PythPriceFeed {
  private client: HermesClient;
  private intervalId: NodeJS.Timeout | null = null;
  private lastPrice: number | null = null;
  private isRunning: boolean = false;
  private asset: AssetType;

  constructor(asset: AssetType = 'BTC') {
    this.client = new HermesClient(HERMES_ENDPOINT);
    this.asset = asset;
  }

  /**
   * Fetch current price from Pyth Network or Custom APIs
   */
  async fetchPrice(): Promise<PriceData> {
    try {
      if (this.asset === 'BYNOMO') {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CUSTOM_TOKENS.BYNOMO}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error('DexScreener API error');
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
          const priceUsd = parseFloat(data.pairs[0].priceUsd);
          this.lastPrice = priceUsd;
          return {
            price: priceUsd,
            confidence: 0,
            timestamp: Date.now() / 1000,
            expo: -8
          };
        }
        throw new Error('No pairs found for BYNOMO');
      }

      // Default Pyth logic
      const assetId = (PRICE_FEED_IDS as any)[this.asset];
      const id = assetId.startsWith('0x') ? assetId : `0x${assetId}`;

      const response = await fetch(`${HERMES_ENDPOINT}/v2/updates/price/latest?ids%5B%5D=${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const priceFeeds = await response.json();
      if (!priceFeeds || !priceFeeds.parsed || priceFeeds.parsed.length === 0) {
        throw new Error('No price data received from Pyth Network');
      }

      const priceFeed = priceFeeds.parsed[0];
      const priceData = priceFeed.price;
      const price = Number(priceData.price) * Math.pow(10, priceData.expo);
      const confidence = Number(priceData.conf) * Math.pow(10, priceData.expo);

      this.lastPrice = price;

      return {
        price,
        confidence,
        timestamp: Number(priceData.publish_time),
        expo: priceData.expo
      };
    } catch (error) {
      console.error(`Error fetching ${this.asset} price:`, error);
      if (this.lastPrice !== null) {
        return {
          price: this.lastPrice,
          confidence: 0,
          timestamp: Date.now() / 1000,
          expo: -8
        };
      }
      throw error;
    }
  }

  setAsset(asset: AssetType): void {
    this.asset = asset;
    this.lastPrice = null;
  }

  getAsset(): AssetType {
    return this.asset;
  }

  async start(callback: (price: number, data: PriceData) => void): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const priceData = await this.fetchPrice();
      callback(priceData.price, priceData);
    } catch (err) { }
    this.intervalId = setInterval(async () => {
      try {
        const priceData = await this.fetchPrice();
        callback(priceData.price, priceData);
      } catch (err) { }
    }, 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  static async fetchAllPrices(): Promise<Record<string, number>> {
    const ids = Object.values(PRICE_FEED_IDS).map(id => id.startsWith('0x') ? id : `0x${id}`);
    const symbols = Object.keys(PRICE_FEED_IDS) as string[];
    const results: Record<string, number> = {};

    try {
      // 1. Pyth
      const queryString = ids.map(id => `ids%5B%5D=${id}`).join('&');
      const response = await fetch(`${HERMES_ENDPOINT}/v2/updates/price/latest?${queryString}`);
      if (response.ok) {
        const data = await response.json();
        if (data.parsed) {
          data.parsed.forEach((feed: any) => {
            const sym = symbols.find(s => (PRICE_FEED_IDS as any)[s].replace('0x', '') === feed.id);
            if (sym) {
              results[sym] = Number(feed.price.price) * Math.pow(10, feed.price.expo);
            }
          });
        }
      }

      // 2. BYNOMO (DexScreener)
      try {
        const bynomoRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CUSTOM_TOKENS.BYNOMO}`, {
          signal: AbortSignal.timeout(5000) // 5s timeout
        });
        if (bynomoRes.ok) {
          const data = await bynomoRes.json();
          if (data.pairs && data.pairs.length > 0) {
            results.BYNOMO = parseFloat(data.pairs[0].priceUsd);
          }
        }
      } catch (tokenErr) {
        // Quietly fail for custom tokens to avoid console spam
      }
    } catch (err) {
      console.error('Error in fetchAllPrices:', err);
    }
    return results;
  }

  getLastPrice(): number | null {
    return this.lastPrice;
  }
}

export const startMultiPythPriceFeed = (
  callback: (prices: Record<string, number>) => void
): (() => void) => {
  let intervalId = setInterval(async () => {
    const prices = await PythPriceFeed.fetchAllPrices();
    callback(prices);
  }, 1000);
  return () => clearInterval(intervalId);
};

export const startPythPriceFeed = (
  callback: (price: number, data: PriceData) => void,
  asset: AssetType = 'BTC'
): (() => void) => {
  const feed = new PythPriceFeed(asset);
  feed.start(callback);
  return () => feed.stop();
};

export const fetchPrice = async (asset: AssetType = 'BTC'): Promise<PriceData> => {
  const feed = new PythPriceFeed(asset);
  return await feed.fetchPrice();
};

export const fetchBTCPrice = async (): Promise<PriceData> => fetchPrice('BTC');

export class MockPriceFeed {
  private basePrice: number;
  private volatility: number;
  private trend: number;
  private intervalId: NodeJS.Timeout | null = null;
  private asset: AssetType;

  constructor(asset: AssetType = 'BTC', basePrice?: number, volatility: number = 0.001, trend: number = 0) {
    this.asset = asset;
    const defaults: Record<string, number> = { BTC: 50000, BNB: 600, BYNOMO: 0.1 };
    this.basePrice = basePrice || defaults[asset] || 1;
    this.volatility = volatility;
    this.trend = trend;
  }

  setAsset(asset: AssetType): void {
    this.asset = asset;
    const defaults: Record<string, number> = { BTC: 50000, BNB: 600, BYNOMO: 0.1 };
    this.basePrice = defaults[asset] || 1;
  }

  getAsset(): AssetType { return this.asset; }

  private generateNextPrice(currentPrice: number): number {
    const change = currentPrice * this.volatility * (Math.random() - 0.5) * 2 + this.trend;
    return currentPrice + change;
  }

  start(callback: (price: number) => void): void {
    let currentPrice = this.basePrice;
    callback(currentPrice);
    this.intervalId = setInterval(() => {
      currentPrice = this.generateNextPrice(currentPrice);
      callback(currentPrice);
    }, 1000);
  }

  stop(): void { if (this.intervalId) clearInterval(this.intervalId); }
}

export const startMockPriceFeed = (
  callback: (price: number) => void,
  options?: { asset?: AssetType; basePrice?: number; volatility?: number; trend?: number }
): (() => void) => {
  const feed = new MockPriceFeed(options?.asset || 'BTC', options?.basePrice, options?.volatility, options?.trend);
  feed.start(callback);
  return () => feed.stop();
};
