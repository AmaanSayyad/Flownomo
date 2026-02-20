'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as d3Shape from 'd3-shape';
import { useStore } from '@/lib/store';
import { AssetType } from '@/lib/utils/priceFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { playWinSound, playLoseSound } from '@/lib/utils/sounds';

interface LiveChartProps {
  betAmount: string;
  setBetAmount: (amount: string) => void;
}

interface ResolvedCell {
  id: string;
  row: number;
  won: boolean;
  timestamp: number;
}

// Track which cells have active bets
interface CellBet {
  cellId: string;
  betId: string;
  amount: number;
  multiplier: number;
  direction: 'UP' | 'DOWN';
}

// Component to safely display asset logos with fallback
const AssetIcon = ({ src, asset, className }: { src: string; asset: string; className: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <span className="font-black text-sm">{asset[0]}</span>;
  }

  // Special handling for different asset types to make them circular and hide white backgrounds
  const isMetal = asset === 'GOLD' || asset === 'SILVER';
  const isNear = asset === 'NEAR';
  const isForex = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD'].includes(asset);

  // Clean className to avoid conflicts when we want object-cover
  const finalImageClass = (isMetal || isForex)
    ? className.replace('object-contain', '').trim() + ' scale-[1.5] object-cover'
    : `${className} object-contain`;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden w-full h-full ${isMetal ? 'rounded-full border border-yellow-400/50 shadow-[0_0_10px_rgba(234,179,8,0.3)] bg-gradient-to-br from-yellow-400/20 to-black' : ''} ${isForex ? 'rounded-full border border-white/20 bg-black/40' : ''} ${isNear ? 'bg-white rounded-full scale-90' : ''}`}>
      <img
        src={src}
        alt={asset}
        className={finalImageClass}
        onError={() => setError(true)}
      />
    </div>
  );
};

export const LiveChart: React.FC<LiveChartProps> = ({ betAmount, setBetAmount }) => {
  const priceHistory = useStore((state) => state.priceHistory);
  const currentPrice = useStore((state) => state.currentPrice);
  const selectedAsset = useStore((state) => state.selectedAsset);
  const userTier = useStore((state) => state.userTier);
  const setSelectedAsset = useStore((state) => state.setSelectedAsset);
  const placeBetFromHouseBalance = useStore((state) => state.placeBetFromHouseBalance);
  const activeBets = useStore((state) => state.activeBets);
  const resolveBet = useStore((state) => state.resolveBet);
  const fetchBalance = useStore((state) => state.fetchBalance);
  const updateBalance = useStore((state) => state.updateBalance);
  const userAddress = useStore((state) => state.address);
  const houseBalance = useStore((state) => state.houseBalance);

  const gameMode = useStore((state) => state.gameMode);
  const timeframeSeconds = useStore((state) => state.timeframeSeconds);
  const isBlitzActive = useStore((state) => state.isBlitzActive);
  const hasBlitzAccess = useStore((state) => state.hasBlitzAccess);
  const blitzMultiplier = useStore((state) => state.blitzMultiplier);
  const lastResult = useStore((state) => state.lastResult);
  const network = useStore((state) => state.network);

  const currencySymbol = useMemo(() => {
    switch (network) {
      case 'XTZ': return 'XTZ';
      case 'NEAR': return 'NEAR';
      case 'SOL': {
        const state = useStore.getState() as any;
        return state.selectedCurrency || 'SOL';
      }
      default: return 'BNB';
    }
  }, [network]);


  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(Date.now());
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const assetSelectorRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });


  // Loading state for price feed
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Track resolved (past) cells - cells that have been "hit" by the chart
  const [resolvedCells, setResolvedCells] = useState<ResolvedCell[]>([]);

  // Local state for tracking cell bets (cells with active bets)
  const [cellBets, setCellBets] = useState<Map<string, CellBet>>(new Map());


  // Warning state for insufficient funds
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);

  // Asset search and category filtering
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [activeAssetCategory, setActiveAssetCategory] = useState<'All' | 'Crypto' | 'Metals' | 'Forex' | 'Stocks'>('All');

  // Bet results for visual feedback (win/lose notifications)
  interface BetResult {
    id: string;
    won: boolean;
    amount: number;
    payout: number;
    multiplier: number;
    timestamp: number;
    x: number;
    y: number;
  }
  const [betResults, setBetResults] = useState<BetResult[]>([]);
  const activeIndicators = useStore((state) => state.activeIndicators);
  const isIndicatorsOpen = useStore((state) => state.isIndicatorsOpen);
  const setIsIndicatorsOpen = useStore((state) => state.setIsIndicatorsOpen);
  const toggleIndicator = useStore((state) => state.toggleIndicator);


  // Auto-remove bet results after 3 seconds
  useEffect(() => {
    if (betResults.length === 0) return;
    const timer = setTimeout(() => {
      setBetResults(prev => prev.filter((r: BetResult) => Date.now() - r.timestamp < 3000));
    }, 100);

    return () => clearTimeout(timer);
  }, [betResults, now]);

  // Sync cellBets from store's activeBets (important when switching modes or assets)
  useEffect(() => {
    const boxBets = activeBets.filter((bet: any) =>
      bet.mode === 'box' &&
      bet.asset === selectedAsset &&
      bet.status === 'active' &&
      bet.cellId
    );

    setCellBets(prev => {
      const newMap = new Map();
      boxBets.forEach((bet: any) => {
        newMap.set(bet.cellId, {
          cellId: bet.cellId,
          betId: bet.id,
          amount: bet.amount,
          multiplier: bet.multiplier,
          direction: bet.direction
        });
      });
      return newMap;
    });
  }, [activeBets, selectedAsset]);



  // Asset display configuration
  const assetConfig: Record<AssetType, { name: string; symbol: string; pair: string; decimals: number; logo: string; category: 'Crypto' | 'Metals' | 'Forex' | 'Stocks' }> = {
    BYNOMO: { name: 'Bynomo Token', symbol: 'BYNOMO', pair: 'BYNOMO/USD', decimals: 6, logo: '/overflowlogo.png', category: 'Crypto' },
    BTC: { name: 'Bitcoin', symbol: 'BTC', pair: 'BTC/USD', decimals: 2, logo: '/logos/bitcoin-btc-logo.png', category: 'Crypto' },
    ETH: { name: 'Ethereum', symbol: 'ETH', pair: 'ETH/USD', decimals: 2, logo: '/logos/ethereum-eth-logo.png', category: 'Crypto' },
    SOL: { name: 'Solana', symbol: 'SOL', pair: 'SOL/USD', decimals: 2, logo: '/logos/solana-sol-logo.png', category: 'Crypto' },
    TRX: { name: 'Tron', symbol: 'TRX', pair: 'TRX/USD', decimals: 4, logo: '/logos/tron-trx-logo.png', category: 'Crypto' },
    XRP: { name: 'Ripple', symbol: 'XRP', pair: 'XRP/USD', decimals: 4, logo: '/logos/xrp-xrp-logo.png', category: 'Crypto' },
    DOGE: { name: 'Dogecoin', symbol: 'DOGE', pair: 'DOGE/USD', decimals: 5, logo: '/logos/dogecoin-doge-logo.png', category: 'Crypto' },
    ADA: { name: 'Cardano', symbol: 'ADA', pair: 'ADA/USD', decimals: 4, logo: '/logos/cardano-ada-logo.png', category: 'Crypto' },
    BCH: { name: 'Bitcoin Cash', symbol: 'BCH', pair: 'BCH/USD', decimals: 2, logo: '/logos/bitcoin-cash-bch-logo.png', category: 'Crypto' },
    BNB: { name: 'Binance Coin', symbol: 'BNB', pair: 'BNB/USD', decimals: 2, logo: '/logos/bnb-bnb-logo.png', category: 'Crypto' },
    SUI: { name: 'Sui', symbol: 'SUI', pair: 'SUI/USD', decimals: 3, logo: '/logos/sui-logo.png', category: 'Crypto' },
    XLM: { name: 'Stellar', symbol: 'XLM', pair: 'XLM/USD', decimals: 5, logo: '/logos/stellar-xlm-logo.png', category: 'Crypto' },
    XTZ: { name: 'Tezos', symbol: 'XTZ', pair: 'XTZ/USD', decimals: 4, logo: '/logos/tezos-xtz-logo.png', category: 'Crypto' },
    NEAR: { name: 'NEAR Protocol', symbol: 'NEAR', pair: 'NEAR/USD', decimals: 4, logo: '/logos/near-logo.svg', category: 'Crypto' },
    // Metals
    GOLD: { name: 'Gold', symbol: 'GOLD', pair: 'GOLD/USD', decimals: 2, logo: '/logos/gold.jpg', category: 'Metals' },
    SILVER: { name: 'Silver', symbol: 'SILVER', pair: 'SILVER/USD', decimals: 3, logo: '/logos/silver.avif', category: 'Metals' },
    // FX
    EUR: { name: 'Euro', symbol: 'EUR', pair: 'EUR/USD', decimals: 5, logo: '/logos/euro.png', category: 'Forex' },
    GBP: { name: 'British Pound', symbol: 'GBP', pair: 'GBP/USD', decimals: 5, logo: '/logos/uk.png', category: 'Forex' },
    JPY: { name: 'Japanese Yen', symbol: 'JPY', pair: 'JPY/USD', decimals: 3, logo: '/logos/japan.jpg', category: 'Forex' },
    AUD: { name: 'Australian Dollar', symbol: 'AUD', pair: 'AUD/USD', decimals: 5, logo: '/logos/australia.png', category: 'Forex' },
    CAD: { name: 'Canadian Dollar', symbol: 'CAD', pair: 'CAD/USD', decimals: 5, logo: '/logos/canada.png', category: 'Forex' },
    // Stocks
    AAPL: { name: 'Apple Inc.', symbol: 'AAPL', pair: 'AAPL/USD', decimals: 2, logo: '/logos/apple.png', category: 'Stocks' },
    GOOGL: { name: 'Alphabet Inc.', symbol: 'GOOGL', pair: 'GOOGL/USD', decimals: 2, logo: '/logos/google.png', category: 'Stocks' },
    AMZN: { name: 'Amazon.com', symbol: 'AMZN', pair: 'AMZN/USD', decimals: 2, logo: '/logos/amazon.png', category: 'Stocks' },
    MSFT: { name: 'Microsoft', symbol: 'MSFT', pair: 'MSFT/USD', decimals: 2, logo: '/logos/microsoft.png', category: 'Stocks' },
    NVDA: { name: 'NVIDIA', symbol: 'NVDA', pair: 'NVDA/USD', decimals: 2, logo: '/logos/nvidia.png', category: 'Stocks' },
    TSLA: { name: 'Tesla Inc.', symbol: 'TSLA', pair: 'TSLA/USD', decimals: 2, logo: '/logos/tesla.png', category: 'Stocks' },
    META: { name: 'Meta Platforms', symbol: 'META', pair: 'META/USD', decimals: 2, logo: '/logos/meta.png', category: 'Stocks' },
    NFLX: { name: 'Netflix Inc.', symbol: 'NFLX', pair: 'NFLX/USD', decimals: 2, logo: '/logos/netflix.png', category: 'Stocks' },
  };



  const currentAssetConfig = assetConfig[selectedAsset] || assetConfig.BTC;

  // Filtered assets based on search and category
  const filteredAssets = useMemo(() => {
    return (Object.keys(assetConfig) as AssetType[]).filter(assetId => {
      const asset = assetConfig[assetId];
      const matchesSearch = asset.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        asset.pair.toLowerCase().includes(assetSearchQuery.toLowerCase());

      const matchesCategory = activeAssetCategory === 'All' || asset.category === activeAssetCategory;

      return matchesSearch && matchesCategory;
    });
  }, [assetSearchQuery, activeAssetCategory]);


  // Stable Y-Axis Domain
  const yDomain = useRef({ min: 0, max: 100, initialized: false });

  // Reset Y-axis domain when asset changes
  useEffect(() => {
    yDomain.current = { min: 0, max: 100, initialized: false };
    setResolvedCells([]); // Clear resolved cells
    setBetResults([]); // Clear bet results
    setCellBets(new Map()); // Clear cell bets
    setIsLoadingPrice(true); // Show loading when switching assets
  }, [selectedAsset]);

  // Hide loading when price data arrives
  useEffect(() => {
    if (currentPrice > 0 && priceHistory.length >= 2) {
      setIsLoadingPrice(false);
    }
  }, [currentPrice, priceHistory]);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Reset Y-axis domain when asset changes to avoid getting stuck at old price levels
  useEffect(() => {
    yDomain.current.initialized = false;
  }, [selectedAsset]);

  // Animation Loop - Optimized for performance
  useEffect(() => {
    let frameId: number;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      // Throttle to ~20fps for better performance
      if (currentTime - lastTime > 50) {
        setNow(currentTime);
        lastTime = currentTime;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Configuration - Responsive + Timeframe
  const isMobile = dimensions.width < 640;
  const historyWidthRatio = isMobile ? 0.35 : 0.50;
  const targetColWidthPx = isMobile ? 100 : 250;
  const gridInterval = (gameMode === 'box' ? timeframeSeconds : 30) * 1000; // ms per column
  const pixelsPerSecond = gameMode === 'box'
    ? Math.max(2, targetColWidthPx / (gridInterval / 1000))
    : (isMobile ? 25 : 50);
  const numRows = 12; // Standardize for all assets to ensure consistent box size

  // Scales
  const scales = useMemo(() => {
    if (dimensions.width === 0 || currentPrice === 0) return null;

    // Use FIRST price in history as stable reference
    const referencePrice = priceHistory.length > 0 ? priceHistory[0].price : currentPrice;

    // DYNAMIC RANGE: Tighter ranges = More visual volatility (zoom in)
    const baseRange = (
      ['EUR', 'GBP', 'JPY', 'AUD', 'CAD'].includes(selectedAsset) ? 0.0007 : // Forex: Moderate zoom
        ['AAPL', 'GOOGL', 'AMZN', 'MSFT', 'NVDA', 'TSLA', 'META', 'NFLX'].includes(selectedAsset) ? 0.0008 : // Stocks: Tight
          ['GOLD', 'SILVER'].includes(selectedAsset) ? 0.0012 : // Metals: Medium
            selectedAsset === 'BTC' ? 0.0015 :
              selectedAsset === 'ETH' ? 0.0018 :
                selectedAsset === 'SOL' ? 0.0025 :
                  0.0020 // Default
    );

    const mobileZoomFactor = isMobile ? 5.0 : 1.0;
    const rangePercent = (gameMode === 'box' ? baseRange * 0.8 : baseRange) * mobileZoomFactor;

    const targetMin = currentPrice * (1 - rangePercent);
    const targetMax = currentPrice * (1 + rangePercent);

    // DYNAMIC Y-axis - lerp towards target to follow price
    if (!yDomain.current.initialized) {
      yDomain.current = { min: targetMin, max: targetMax, initialized: true };
    } else {
      // Smoothing factor (lower = smoother, higher = faster tracking)
      const lerpFactor = 0.05;
      yDomain.current.min = yDomain.current.min + (targetMin - yDomain.current.min) * lerpFactor;
      yDomain.current.max = yDomain.current.max + (targetMax - yDomain.current.max) * lerpFactor;
    }

    const { min: minY, max: maxY } = yDomain.current;

    const yScale = (price: number) => {
      return dimensions.height - ((price - minY) / (maxY - minY)) * dimensions.height;
    };

    const tipX = dimensions.width * historyWidthRatio;

    const xScale = (timestamp: number) => {
      const diffMs = timestamp - now;
      const diffSeconds = diffMs / 1000;
      return tipX + (diffSeconds * pixelsPerSecond);
    };

    return { yScale, xScale, tipX, minY, maxY };
  }, [dimensions, priceHistory, currentPrice, now, selectedAsset]);

  const scalesRef = useRef(scales);
  const currentPriceRef = useRef(currentPrice);

  useEffect(() => {
    scalesRef.current = scales;
    currentPriceRef.current = currentPrice;
  }, [scales, currentPrice]);



  // Handle classic (binomo) mode bet results at the graph tip
  const lastProcessedResultRef = useRef<number>(0);
  useEffect(() => {
    if (lastResult && gameMode === 'binomo' && scales && lastResult.timestamp > lastProcessedResultRef.current) {
      lastProcessedResultRef.current = lastResult.timestamp;

      const multiplier = lastResult.amount > 0 ? lastResult.payout / lastResult.amount : 0;

      const result: BetResult = {
        id: `classic-${lastResult.timestamp}`,
        won: lastResult.won,
        amount: lastResult.amount,
        payout: lastResult.payout,
        multiplier: Number(multiplier.toFixed(2)),
        timestamp: Date.now(),
        x: scales.tipX,
        y: scales.yScale(currentPrice)
      };

      setBetResults(prev => [...prev, result]);

      // Play sound effects
      if (lastResult.won) {
        playWinSound();
      } else {
        playLoseSound();
      }
    }
  }, [lastResult, gameMode, scales, currentPrice, playWinSound, playLoseSound]);

  // Chart Path
  const chartPath = useMemo(() => {
    // Don't render if no valid price data or price is 0
    if (!scales || priceHistory.length < 2 || currentPrice === 0) return '';

    const visiblePoints = priceHistory.filter((p: any) => {
      const x = scales.xScale(p.timestamp);
      return x > -50 && x <= scales.tipX + 5;
    });

    // Need at least 2 visible points
    if (visiblePoints.length < 2) return '';

    const pointsToRender = [...visiblePoints];

    // Only add current live point if we have history and valid price
    // This prevents drawing a line from old asset price to new asset price
    if (priceHistory.length >= 2 && currentPrice > 0) {
      pointsToRender.push({ timestamp: now, price: currentPrice });
    }

    const lineGenerator = d3Shape.line<{ timestamp: number, price: number }>()
      .x((d) => scales.xScale(d.timestamp))
      .y((d) => scales.yScale(d.price))
      .curve(d3Shape.curveMonotoneX);

    return lineGenerator(pointsToRender) || '';
  }, [scales, priceHistory, currentPrice, now]);

  // TECHNICAL INDICATORS CALCULATION
  const indicatorPaths = useMemo(() => {
    if (!scales) return null;

    const paths: Record<string, string | string[]> = {};
    const points = [...priceHistory, { timestamp: now, price: currentPrice }];

    // 1. Moving Average (SMA 20)
    if (activeIndicators['ma'] && points.length >= 2) {
      const maPoints = [];
      const period = 20;
      for (let i = 1; i < points.length; i++) {
        const currentPeriod = Math.min(i + 1, period);
        const slice = points.slice(Math.max(0, i + 1 - currentPeriod), i + 1);
        const avg = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
        maPoints.push({ timestamp: points[i].timestamp, price: avg });
      }
      const lineGen = d3Shape.line<{ timestamp: number, price: number }>()
        .x(d => scales.xScale(d.timestamp))
        .y(d => scales.yScale(d.price))
        .curve(d3Shape.curveMonotoneX);
      paths.ma = lineGen(maPoints) || '';
    }

    // 2. Bollinger Bands (20, 2)
    if (activeIndicators['bollinger'] && points.length >= 2) {
      const topPoints = [];
      const bottomPoints = [];
      const midPoints = [];
      const period = 20;

      for (let i = 1; i < points.length; i++) {
        const currentPeriod = Math.min(i + 1, period);
        const slice = points.slice(Math.max(0, i + 1 - currentPeriod), i + 1).map(p => p.price);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;

        let stdDev = 0;
        if (slice.length > 1) {
          stdDev = Math.sqrt(slice.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / slice.length);
        }

        topPoints.push({ timestamp: points[i].timestamp, price: avg + 2 * stdDev });
        bottomPoints.push({ timestamp: points[i].timestamp, price: avg - 2 * stdDev });
        midPoints.push({ timestamp: points[i].timestamp, price: avg });
      }

      const lineGen = d3Shape.line<{ timestamp: number, price: number }>()
        .x(d => scales.xScale(d.timestamp))
        .y(d => scales.yScale(d.price))
        .curve(d3Shape.curveMonotoneX);

      paths.bollinger = [
        lineGen(topPoints) || '',
        lineGen(bottomPoints) || '',
        lineGen(midPoints) || ''
      ];
    }

    // 3. Alligator
    if (activeIndicators['alligator'] && points.length >= 2) {
      const calculateDynamicSMA = (period: number) => {
        const sma = [];
        for (let i = 1; i < points.length; i++) {
          const currentPeriod = Math.min(i + 1, period);
          const slice = points.slice(Math.max(0, i + 1 - currentPeriod), i + 1);
          const avg = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
          sma.push({ timestamp: points[i].timestamp, price: avg });
        }
        return sma;
      };

      const lineGen = d3Shape.line<{ timestamp: number, price: number }>()
        .x(d => scales.xScale(d.timestamp))
        .y(d => scales.yScale(d.price))
        .curve(d3Shape.curveMonotoneX);

      paths.alligator = [
        lineGen(calculateDynamicSMA(13)) || '', // Jaw
      ];
    }

    // 4. RSI (14) - Refined Wilder's Smoothing
    if (activeIndicators['rsi'] && points.length >= 2) {
      const rsiPoints = [];
      let avgGain = 0;
      let avgLoss = 0;
      const period = 14;

      for (let i = 1; i < points.length; i++) {
        const change = points[i].price - points[i - 1].price;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        if (i <= period) {
          avgGain += gain;
          avgLoss += loss;
          if (i === period) {
            avgGain /= period;
            avgLoss /= period;
            const rs = avgGain / (avgLoss || 0.00001);
            rsiPoints.push({ timestamp: points[i].timestamp, rsi: 100 - (100 / (1 + rs)) });
          } else {
            rsiPoints.push({ timestamp: points[i].timestamp, rsi: 50 });
          }
        } else {
          // Precise Wilder's Smoothing
          avgGain = (avgGain * (period - 1) + gain) / period;
          avgLoss = (avgLoss * (period - 1) + loss) / period;
          const rs = avgGain / (avgLoss || 0.00001);
          const rsiValue = 100 - (100 / (1 + rs));
          rsiPoints.push({ timestamp: points[i].timestamp, rsi: rsiValue });
        }
      }
      paths.rsi = JSON.stringify(rsiPoints);
    }

    return paths;
  }, [scales, priceHistory, now, currentPrice, activeIndicators]);

  // Continuous Grid Generation
  // Cells are now positioned based on PRICE LEVELS, not fixed pixels
  const betCells = useMemo(() => {
    if (!scales || dimensions.height === 0) return [];

    const cells = [];
    const colWidth = (gridInterval / 1000) * pixelsPerSecond;

    // Calculate a stable price step based on the current range to ensure the grid "slides" correctly
    const rawStep = (scales.maxY - scales.minY) / 10;
    // Snap to "nice" numbers (e.g., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100...)
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    let priceStep;
    if (normalized < 1.5) priceStep = 1 * magnitude;
    else if (normalized < 3) priceStep = 2 * magnitude;
    else if (normalized < 7) priceStep = 5 * magnitude;
    else priceStep = 10 * magnitude;


    // Calculate visible price range with large buffer (2x viewport)
    const viewPadding = (scales.maxY - scales.minY) * 1.5;

    const gridMaxY = scales.maxY + viewPadding;
    const gridMinY = scales.minY - viewPadding;

    // Stable snap points
    const startPrice = Math.floor(gridMaxY / priceStep) * priceStep;
    const endPrice = Math.ceil(gridMinY / priceStep) * priceStep;

    const priceRange = scales.maxY - scales.minY;

    // Time-based generation for stable keys
    const startTime = Math.floor(now / gridInterval) * gridInterval - gridInterval;
    const endTime = now + ((dimensions.width - scales.tipX) / pixelsPerSecond) * 1000 + gridInterval * 2;

    for (let colTimestamp = startTime; colTimestamp <= endTime; colTimestamp += gridInterval) {
      const colX = scales.xScale(colTimestamp);

      if (colX + colWidth < 0) continue;
      if (colX > dimensions.width + 100) continue;

      const isCrossing = colX <= scales.tipX && colX + colWidth > scales.tipX;
      const isPast = colX + colWidth <= scales.tipX;


      // Loop through price levels
      for (let rowPriceTop = startPrice; rowPriceTop >= endPrice; rowPriceTop -= priceStep) {
        const rowPriceBottom = rowPriceTop - priceStep;
        const rowPriceCenter = (rowPriceTop + rowPriceBottom) / 2;
        const priceLevelIndex = Math.round(rowPriceTop / priceStep);

        // Convert price to Y position using the scale
        const y = scales.yScale(rowPriceTop);
        const cellBottom = scales.yScale(rowPriceBottom);
        const rowHeight = cellBottom - y;

        // Skip if completely off screen vertically to save performance
        if (y > dimensions.height + 50 || cellBottom < -50) continue;

        // Determine win/loss for cells crossing or past
        let status: 'future' | 'active' | 'won' | 'lost' = 'future';

        if (isCrossing) {
          if (currentPrice <= rowPriceTop && currentPrice >= rowPriceBottom) {
            status = 'won';
          } else {
            status = 'active';
          }
        } else if (isPast) {
          status = 'lost';
        }


        const isUp = rowPriceCenter > currentPrice;
        const priceInRow = currentPrice <= rowPriceTop && currentPrice >= rowPriceBottom;

        let baseMultiplier: number;
        if (priceInRow) {
          baseMultiplier = 1.01;
        } else {
          // Distance from CURRENT PRICE in price terms
          const priceDist = Math.abs(rowPriceCenter - currentPrice);
          const normalizedDist = Math.min(priceDist / (priceRange * 0.8), 1);
          baseMultiplier = 1.05 + Math.pow(normalizedDist, 1.3) * 3.95;
        }

        const timeBonus = Math.max(0, (colX - scales.tipX) / 800) * 0.25;
        let calculatedMultiplier = Math.min(baseMultiplier + timeBonus, 10.0);

        // BLITZ MODE BOOST (x2 Multiplier) - Reduced density as requested
        const colIndex = Math.floor(colTimestamp / gridInterval);
        const isHighStake = baseMultiplier > 2.2; // Only very high risk cells
        const isLuckyDiagonal = (priceLevelIndex + colIndex) % 5 === 0; // Less frequent (1 in 5 instead of 1 in 3)
        const isBlitzBoosted = isBlitzActive && hasBlitzAccess && (isHighStake || isLuckyDiagonal);



        if (isBlitzBoosted) {
          calculatedMultiplier = calculatedMultiplier * blitzMultiplier;
        }

        const multiplier = Math.min(calculatedMultiplier, 20).toFixed(2);

        // Visual properties
        const distFromCenter = Math.abs(rowPriceCenter - currentPrice) / priceRange;
        const intensity = Math.min(distFromCenter * 1.5, 1);

        // Orange hue for Blitz, Purple otherwise
        const hue = isBlitzBoosted ? 25 : 270;
        const saturation = isBlitzBoosted ? 80 + intensity * 15 : 50 + intensity * 30;
        const lightness = isBlitzBoosted ? 55 : 45;
        const alpha = isBlitzBoosted ? 0.5 - intensity * 0.2 : 0.4 - intensity * 0.35;

        const cellColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${Math.max(0.05, alpha)})`;
        const borderColor = isBlitzBoosted
          ? `hsla(${hue}, 90%, 60%, ${0.7 - intensity * 0.3})`
          : `hsla(${hue}, 70%, 55%, ${Math.max(0.1, 0.5 - intensity * 0.4)})`;

        cells.push({
          id: `cell-${colTimestamp}-${priceLevelIndex}`,
          x: colX,
          y,
          width: colWidth - 3,
          height: Math.max(rowHeight - 3, 5),
          multiplier,
          isUp,
          status,
          color: cellColor,
          borderColor: borderColor,
          priceTop: rowPriceTop,
          priceBottom: rowPriceBottom,
          isBlitzBoosted
        });
      }
    }

    return cells;
  }, [scales, now, currentPrice, dimensions, gameMode, timeframeSeconds, selectedAsset, isBlitzActive, hasBlitzAccess, blitzMultiplier]);




  // Handle bet resolution when chart crosses cells with active bets
  useEffect(() => {
    if (!scales || cellBets.size === 0 || gameMode !== 'box') return;

    betCells.forEach((cell: any) => {
      const bet = cellBets.get(cell.id);
      if (!bet) return;

      // Check if this cell is being crossed or has been passed
      const isCrossing = cell.status === 'active' || cell.status === 'won' || cell.status === 'lost';

      if (isCrossing) {
        // Determine if bet won or lost based on current price
        const won = currentPrice <= cell.priceTop && currentPrice >= cell.priceBottom;
        const payout = won ? bet.amount * bet.multiplier : 0;

        // Remove from cellBets
        setCellBets(prev => {
          const newMap = new Map(prev);
          newMap.delete(cell.id);
          return newMap;
        });

        // Resolve the bet in the store
        resolveBet(bet.betId, won, payout);

        // Add bet result notification
        setBetResults(prev => [...prev, {
          id: `result-${bet.betId}`,
          won,
          amount: bet.amount,
          payout,
          multiplier: bet.multiplier,
          timestamp: Date.now(),
          x: cell.x,
          y: cell.y
        }]);

        // Play sound effect
        if (won) {
          playWinSound();
        } else {
          playLoseSound();
        }

        // Update house balance via API (skip for demo mode)
        const isDemoMode = userAddress?.startsWith('0xDEMO');

        if (userAddress && !isDemoMode) {
          // Real mode - use API
          if (won) {
            fetch('/api/balance/win', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userAddress,
                winAmount: payout,
                betId: bet.betId
              })
            }).then(() => {
              fetchBalance(userAddress);
            }).catch(console.error);
          } else {
            // If lost, just refresh balance (already deducted)
            fetchBalance(userAddress);
          }
        } else if (isDemoMode && won) {
          // Demo mode - update locally on win (bet amount already subtracted)
          updateBalance(payout, 'add');
        }

        // Add to resolved cells for visual feedback
        setResolvedCells(prev => [...prev, {
          id: cell.id,
          row: 0,
          won,
          timestamp: Date.now()
        }]);

        console.log(`Bet resolved: ${won ? 'WON' : 'LOST'} - Amount: ${bet.amount}, Multiplier: ${bet.multiplier}, Payout: ${payout}`);
      }
    });
  }, [betCells, cellBets, scales, currentPrice, resolveBet, userAddress, fetchBalance, playWinSound, playLoseSound, gameMode]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 bg-[#02040A] overflow-hidden select-none">
      {/* Loading State */}
      {isLoadingPrice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#02040A]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            </div>
            {/* Text */}
            <div className="text-center">
              <p className="text-white text-sm font-medium mb-1">Loading {currentAssetConfig.name} Price</p>
              <p className="text-gray-500 text-xs">Connecting to Pyth Network...</p>
            </div>
          </div>
        </div>
      )}

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Box Mode: Grid Cells layer */}
      {gameMode === 'box' && (
        <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
          {betCells.map((cell: any) => {
            // Visual styling based on status
            let opacity = 0.9;
            let bg = cell.color;
            let borderStyle = `1px solid ${cell.borderColor}`;
            let canBet = cell.status === 'future';
            let extraClass = '';

            if (cell.status === 'won') {
              // Won cell - purple with explosion ring effect (higher opacity)
              return (
                <div key={cell.id} className="pointer-events-none">
                  <div
                    className="absolute rounded-sm animate-ping"
                    style={{
                      left: cell.x - 5,
                      top: cell.y - 5,
                      width: cell.width + 10,
                      height: cell.height + 10,
                      backgroundColor: '#a855f7',
                      opacity: 0.5
                    }}
                  />
                  <div
                    className="absolute rounded-sm flex items-center justify-center"
                    style={{
                      left: cell.x,
                      top: cell.y,
                      width: cell.width,
                      height: cell.height,
                      backgroundColor: 'rgba(168, 85, 247, 0.9)',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 20px #a855f7'
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono font-bold text-white">
                        x{cell.multiplier}
                      </span>
                    </div>
                  </div>
                </div>
              );
            } else if (cell.status === 'lost') {
              return null;
            } else if (cell.status === 'active') {
              opacity = 1;
              borderStyle = `2px solid rgba(255,255,255,0.5)`;
              extraClass = 'ring-1 ring-white/30';
            }

            const handleClick = async () => {
              if (canBet && betAmount && userAddress) {
                const requiredAmount = parseFloat(betAmount);
                const currentBalance = houseBalance || 0;

                if (currentBalance < requiredAmount) {
                  setShowInsufficientFunds(true);
                  setTimeout(() => setShowInsufficientFunds(false), 2000);
                  return;
                }

                try {
                  const targetId = `${cell.isUp ? 'UP' : 'DOWN'}-${cell.multiplier}-${timeframeSeconds}`;
                  const result = await placeBetFromHouseBalance(
                    betAmount,
                    targetId,
                    userAddress,
                    cell.id
                  );

                  if (result && result.bet) {
                    // cellBets will be automatically updated by the useEffect watching activeBets
                  }
                } catch (error) {
                  console.error('Failed to place box bet:', error);
                }
              }
            };

            const hasBet = cellBets.has(cell.id);
            if (hasBet) {
              bg = 'rgba(0, 255, 255, 0.4)';
              borderStyle = '2px solid #00FFFF';
              extraClass = 'ring-2 ring-cyan-400/50 animate-pulse';
            }

            return (
              <div
                key={cell.id}
                onClick={handleClick}
                className={`absolute rounded-sm flex items-center justify-center transition-opacity duration-300 ${canBet ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'} ${extraClass}`}
                style={{
                  left: cell.x,
                  top: cell.y,
                  width: cell.width,
                  height: cell.height,
                  backgroundColor: bg,
                  border: borderStyle,
                  opacity
                }}
              >
                <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none">
                  {hasBet ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col items-center">
                        <span className="text-[14px] font-black text-white tracking-tighter leading-none drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                          {(parseFloat(cellBets.get(cell.id)?.amount as any || '0') * parseFloat(cellBets.get(cell.id)?.multiplier as any || '1')).toFixed(2)}
                        </span>
                        <span className="text-[7px] font-black uppercase text-cyan-400/80 tracking-[0.2em] mt-0.5">
                          {currencySymbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <span className="text-[9px] font-bold text-white/50 tracking-tighter">
                          {cellBets.get(cell.id)?.multiplier}x
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black transition-colors ${cell.isBlitzBoosted ? 'text-orange-100 drop-shadow-[0_0_5px_rgba(255,165,0,0.8)]' : 'text-white/40'}`}>
                        {cell.multiplier}x
                      </span>
                      {cell.isBlitzBoosted && (
                        <span className="text-[6px] font-black text-orange-400 uppercase tracking-widest mt-0.5">
                          BLITZ
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );

          })}
        </div>
      )}

      {/* Classic mode: Active Bets SVG Overlay - Strike and Expiration lines */}
      <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
        {gameMode === 'binomo' && scales && activeBets.map((bet: any) => {
          if (bet.status !== 'active') return null;

          const strikeY = scales.yScale(bet.strikePrice);
          const expirationX = scales.xScale(bet.endTime);
          const nowX = scales.tipX;

          // Only show if expiration is in the future
          if (expirationX < 0) return null;

          const isUp = bet.direction === 'UP';
          const isWinning = isUp ? currentPrice > bet.strikePrice : currentPrice < bet.strikePrice;
          const color = isUp ? '#22c55e' : '#ef4444';
          const glowColor = isWinning ? color : '#666';

          return (
            <g key={bet.id}>
              {/* Strike Line (Horizontal) */}
              <line
                x1={nowX}
                y1={strikeY}
                x2={Math.max(nowX, expirationX)}
                y2={strikeY}
                stroke={color}
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-70"
              />

              {/* Expiration Line (Vertical) */}
              {expirationX > nowX && (
                <line
                  x1={expirationX}
                  y1={0}
                  x2={expirationX}
                  y2={dimensions.height}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                  strokeDasharray="8 4"
                />
              )}

              {/* Price Filling Area (Optional but looks cool) */}
              {expirationX > nowX && (
                <rect
                  x={nowX}
                  y={isUp ? Math.min(strikeY, scales.yScale(currentPrice)) : strikeY}
                  width={expirationX - nowX}
                  height={Math.abs(strikeY - scales.yScale(currentPrice))}
                  fill={color}
                  fillOpacity="0.05"
                />
              )}

              {/* Label at Strike Price */}
              <text
                x={nowX + 5}
                y={strikeY - 5}
                fill={color}
                fontSize="10"
                fontFamily="monospace"
                className="font-bold opacity-80"
              >
                {bet.direction} {bet.amount} {currencySymbol} {bet.strikePrice && `@ $${bet.strikePrice.toFixed(2)}`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* SVG Layer for Chart - ON TOP */}
      <svg
        key={`chart-${selectedAsset}`}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      >
        {scales && (
          <>
            {/* Y-Axis Price Ticks */}
            <g className="y-axis">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((tick) => {
                const price = scales.minY + (scales.maxY - scales.minY) * tick;
                const y = scales.yScale(price);
                return (
                  <g key={`y-tick-${tick}`}>
                    <line x1={0} y1={y} x2={dimensions.width} y2={y} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
                    <text
                      x={dimensions.width - 5}
                      y={y - 5}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                      className="opacity-50"
                    >
                      {price.toLocaleString('en-US', { minimumFractionDigits: currentAssetConfig.decimals })}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* X-Axis Time Ticks */}
            <g className="x-axis">
              {(() => {
                // Dynamic tick interval based on pixelsPerSecond
                // We want at least 120px between time labels to prevent overlap
                const minSpacing = 120;
                let tickInterval = 10;

                if (pixelsPerSecond < minSpacing / 10) tickInterval = 30;
                if (pixelsPerSecond < minSpacing / 30) tickInterval = 60;
                if (pixelsPerSecond < minSpacing / 60) tickInterval = 120;
                if (pixelsPerSecond < minSpacing / 120) tickInterval = 300;
                if (pixelsPerSecond < minSpacing / 300) tickInterval = 600;

                // Calculate range of seconds to show based on visible dimensions
                const secondsPast = scales.tipX / pixelsPerSecond;
                const secondsFuture = (dimensions.width - scales.tipX) / pixelsPerSecond;

                const startSec = Math.floor(-secondsPast / tickInterval) * tickInterval;
                const endSec = Math.ceil(secondsFuture / tickInterval) * tickInterval;

                const ticks = [];
                for (let s = startSec; s <= endSec; s += tickInterval) {
                  ticks.push(s);
                }

                return ticks.map((sec) => {
                  const ts = now + sec * 1000;
                  const x = scales.xScale(ts);
                  if (x < 0 || x > dimensions.width) return null;
                  return (
                    <g key={`x-tick-${sec}`}>
                      <line x1={x} y1={0} x2={x} y2={dimensions.height} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
                      <text
                        x={x + 5}
                        y={dimensions.height - 10}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                        className="opacity-40"
                      >
                        {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </text>
                    </g>
                  );
                });
              })()}
            </g>

            {chartPath && currentPrice > 0 && (
              <>
                {/* Glow effect */}
                <path
                  d={chartPath}
                  fill="none"
                  stroke="#00FF9D"
                  strokeWidth="12"
                  strokeOpacity="0.2"
                  strokeLinecap="round"
                />
                {/* Main line */}
                <path
                  d={chartPath}
                  fill="none"
                  stroke="#00FF9D"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Tip indicator */}
                <circle
                  cx={scales.tipX}
                  cy={scales.yScale(currentPrice)}
                  r="5"
                  fill="#00FF9D"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Horizontal price line */}
                <line
                  x1={0}
                  y1={scales.yScale(currentPrice)}
                  x2={scales.tipX - 10}
                  y2={scales.yScale(currentPrice)}
                  stroke="#00F0FF"
                  strokeOpacity="0.3"
                  strokeDasharray="4 4"
                />

                {/* TECHNICAL INDICATORS RENDER */}
                {indicatorPaths && (
                  <g className="indicators-layer">
                    {/* Moving Average */}
                    {activeIndicators['ma'] && indicatorPaths.ma && (
                      <path
                        d={indicatorPaths.ma as string}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        opacity="0.8"
                      />
                    )}

                    {/* Bollinger Bands */}
                    {activeIndicators['bollinger'] && indicatorPaths.bollinger && (
                      <g>
                        <path
                          d={(indicatorPaths.bollinger as string[])[0]}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          opacity="0.5"
                        />
                        <path
                          d={(indicatorPaths.bollinger as string[])[1]}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          opacity="0.5"
                        />
                        <path
                          d={(indicatorPaths.bollinger as string[])[2]}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                          opacity="0.3"
                        />
                      </g>
                    )}

                    {/* Alligator */}
                    {activeIndicators['alligator'] && indicatorPaths.alligator && (
                      <g>
                        <path d={(indicatorPaths.alligator as string[])[0]} fill="none" stroke="#2563eb" strokeWidth="2" opacity="0.6" />
                        <path d={(indicatorPaths.alligator as string[])[1]} fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.6" />
                        <path d={(indicatorPaths.alligator as string[])[2]} fill="none" stroke="#16a34a" strokeWidth="2" opacity="0.6" />
                      </g>
                    )}

                    {/* RSI Advanced Visualization */}
                    {activeIndicators['rsi'] && indicatorPaths.rsi && (() => {
                      try {
                        const rsiPoints = JSON.parse(indicatorPaths.rsi as string);
                        const rsiLine = d3Shape.line<{ timestamp: number, rsi: number }>()
                          .x(d => scales.xScale(d.timestamp))
                          .y(d => dimensions.height - 40 - (d.rsi / 100) * 80)
                          .curve(d3Shape.curveMonotoneX);

                        const panelHeight = 100;
                        const panelY = dimensions.height - panelHeight - 20;

                        return (
                          <g transform={`translate(0, ${panelY})`}>
                            {/* Panel Background */}
                            <rect x={0} y={0} width={dimensions.width} height={panelHeight} fill="rgba(0,0,0,0.4)" backdrop-blur="md" />
                            <line x1={0} y1={0} x2={dimensions.width} y2={0} stroke="rgba(168,85,247,0.3)" strokeWidth="1" />

                            {/* Zones (70-30) */}
                            <line x1={0} y1={30} x2={dimensions.width} y2={30} stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1={0} y1={70} x2={dimensions.width} y2={70} stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" strokeDasharray="4 4" />

                            {/* Labels */}
                            <text x={10} y={25} fill="rgba(239, 68, 68, 0.5)" fontSize="8" fontWeight="bold">70 OVERBOUGHT</text>
                            <text x={10} y={65} fill="rgba(34, 197, 94, 0.5)" fontSize="8" fontWeight="bold">30 OVERSOLD</text>

                            {/* RSI Line */}
                            <path
                              d={d3Shape.line<{ timestamp: number, rsi: number }>()
                                .x(d => scales.xScale(d.timestamp))
                                .y(d => panelHeight - (d.rsi / 100) * panelHeight)
                                .curve(d3Shape.curveMonotoneX)(rsiPoints) || ''}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="2"
                              filter="drop-shadow(0 0 4px rgba(168,85,247,0.5))"
                            />

                            <text x={dimensions.width - 15} y={15} fill="#a855f7" fontSize="10" fontWeight="black" textAnchor="end" opacity="0.8">RSI PRO (14)</text>
                          </g>
                        );
                      } catch (e) { return null; }
                    })()}

                  </g>
                )}
              </>
            )}
          </>
        )}
      </svg>

      {/* Price Header with Asset Selector - Dropdown Version */}
      <div className="absolute top-4 sm:top-6 left-3 sm:left-6 pointer-events-auto z-40">
        <div className="relative mb-4">
          {/* Trigger Button */}
          <button
            ref={assetSelectorRef}
            onClick={() => {
              if (!isAssetDropdownOpen && assetSelectorRef.current) {
                const rect = assetSelectorRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom + 8, left: rect.left });
              }
              setIsAssetDropdownOpen(!isAssetDropdownOpen);
            }}
            data-tour="asset-selector"
            className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all duration-300 group"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${isAssetDropdownOpen ? 'bg-purple-500 text-white' : 'bg-white/5 text-purple-400'}`}>
              <AssetIcon
                src={currentAssetConfig.logo}
                asset={selectedAsset}
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Asset</p>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-black tracking-tight">{selectedAsset}</span>
                <svg
                  className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${isAssetDropdownOpen ? 'rotate-180 text-purple-400' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Price Display */}
        <div className="pointer-events-none" data-tour="price-display">
          <h2 className="text-gray-500 text-[10px] sm:text-xs tracking-widest font-mono mb-0.5 sm:mb-1 uppercase font-black opacity-60">
            {currentAssetConfig.pair} Live Price
          </h2>
          <div className="flex flex-col">
            <p className="text-white text-3xl sm:text-5xl font-black font-mono tracking-tighter">
              ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', {
                minimumFractionDigits: currentAssetConfig.decimals,
                maximumFractionDigits: currentAssetConfig.decimals
              }) : '---'}
            </p>
            <div className="flex items-center gap-1.5 mt-1 opacity-50">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
              />
              <span className="text-[9px] text-gray-400 font-black tracking-[0.2em] uppercase">
                Powered by Pyth Hermes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Selection UI - Positioned absolute to follow the new trigger */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-50 pointer-events-none">
        <AnimatePresence>
          {isIndicatorsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-[calc(100vw-32px)] sm:w-56 max-w-xs bg-[#0d0d0d]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-between items-center px-3 py-2 mb-2 border-b border-white/5">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Indicators</p>
                <button
                  onClick={() => setIsIndicatorsOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              {[

                {
                  id: 'ma', name: 'Moving Average', icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )
                },
                {
                  id: 'alligator', name: 'Alligator', icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  )
                },
                {
                  id: 'bollinger', name: 'Bollinger Bands', icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )
                },
                {
                  id: 'rsi', name: 'RSI', icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M3 4v16M3 20h18" />
                    </svg>
                  )
                },
              ].map(indicator => (
                <button
                  key={indicator.id}
                  onClick={() => toggleIndicator(indicator.id)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 mb-1 last:mb-0 group
                    ${activeIndicators[indicator.id]
                      ? 'bg-purple-600/20 border border-purple-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${activeIndicators[indicator.id] ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                    {indicator.icon}
                  </div>
                  <span className={`flex-1 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${activeIndicators[indicator.id] ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {indicator.name}
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${activeIndicators[indicator.id] ? 'bg-purple-500 scale-100 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-white/10 scale-50'}`} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Insufficient Funds Warning - Minimalist Toast */}
      {showInsufficientFunds && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 bg-orange-500/20 backdrop-blur-md border border-orange-400/40 rounded-xl">
            <p className="text-orange-300 text-sm font-medium">
              Insufficient balance
            </p>
          </div>
        </div>
      )}

      {/* Bet Result Notifications - Modern floating feedback */}
      <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
        {betResults.map((result) => {
          const age = Date.now() - result.timestamp;
          const opacity = Math.max(0, 1 - age / 3000);
          const translateY = -age / 20; // Float upward faster

          return (
            <div
              key={result.id}
              className="absolute"
              style={{
                left: Math.min(Math.max(result.x, 80), dimensions.width - 140),
                top: Math.min(Math.max(result.y + translateY, 40), dimensions.height - 120),
                opacity,
                transform: `translateY(${translateY}px)`,
              }}
            >
              {/* Modern Glassmorphism Card */}
              <div className={`
                relative px-5 py-3 rounded-2xl backdrop-blur-xl
                ${result.won
                  ? 'bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-green-600/30 border border-green-400/60 shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                  : 'bg-gradient-to-br from-red-500/30 via-rose-500/20 to-red-600/30 border border-red-400/60 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                }
              `}>
                {/* Animated glow ring */}
                <div className={`absolute -inset-1 rounded-2xl blur-sm ${result.won ? 'bg-green-400/20' : 'bg-red-400/20'} animate-pulse`} />

                {/* Content */}
                <div className="relative flex items-center gap-3">
                  {/* Icon */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-xl
                    ${result.won
                      ? 'bg-green-400/30 text-green-300'
                      : 'bg-red-400/30 text-red-300'
                    }
                  `}>
                    {result.won ? '✓' : '✕'}
                  </div>

                  {/* Text */}
                  <div>
                    <p className={`text-sm font-black tracking-wide ${result.won ? 'text-green-300' : 'text-red-300'}`}>
                      {result.won ? 'WIN!' : 'LOST'}
                    </p>
                    <p className={`text-lg font-bold ${result.won ? 'text-green-100' : 'text-red-100'}`}>
                      {result.won
                        ? `+${result.payout.toFixed(4)}`
                        : `-${result.amount.toFixed(4)}`
                      }
                      <span className="text-xs ml-1 opacity-70">{currencySymbol}</span>
                    </p>
                  </div>

                  {/* Multiplier badge (for wins) */}
                  {result.won && (
                    <div className="px-2 py-0.5 rounded-lg bg-green-400/20 text-green-200 text-xs font-bold">
                      x{result.multiplier}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset Dropdown - rendered via Portal to escape all stacking contexts */}
      {isAssetDropdownOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsAssetDropdownOpen(false)}
          />

          {/* Dropdown Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
            className="w-72 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[9999] p-3"
          >
            {/* Search Input */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search assets..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 mb-3 bg-white/5 p-1 rounded-xl">
              {(['All', 'Crypto', 'Metals', 'Forex', 'Stocks'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveAssetCategory(cat)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${activeAssetCategory === cat ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Asset List */}
            <div className="max-h-[320px] overflow-y-auto scrollbar-none no-scrollbar grid grid-cols-1 gap-1">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <button
                    key={asset}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setIsAssetDropdownOpen(false);
                      setAssetSearchQuery('');
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group
                      ${selectedAsset === asset
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${selectedAsset === asset ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                      <AssetIcon
                        src={assetConfig[asset].logo}
                        asset={asset}
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-black tracking-tight">{assetConfig[asset].name}</p>
                        {assetConfig[asset].category === 'Crypto' && (
                          <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 rounded-sm font-bold uppercase">Crypto</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold font-mono">{assetConfig[asset].pair}</p>
                    </div>
                    {selectedAsset === asset && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-xs font-bold">No assets found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>,
        document.body
      )}
    </div>
  );
};
