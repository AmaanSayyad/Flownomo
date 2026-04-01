'use client';

import React, { useEffect, useMemo, useState } from 'react';

type LogoItem = {
  key: string;
  src: string;
  alt: string;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const baseChainLogos: LogoItem[] = [
  { key: 'FLOW', src: '/flow-flow-logo.png', alt: 'Flow' },
  { key: 'BTC', src: '/logos/bitcoin-btc-logo.png', alt: 'Bitcoin' },
  { key: 'ETH', src: '/logos/ethereum-eth-logo.png', alt: 'Ethereum' },
  { key: 'SOL', src: '/logos/solana-sol-logo.png', alt: 'Solana' },
  { key: 'SUI', src: '/logos/sui-logo.png', alt: 'Sui' },
  { key: 'XLM', src: '/logos/stellar-xlm-logo.png', alt: 'Stellar' },
  { key: 'XTZ', src: '/logos/tezos-xtz-logo.png', alt: 'Tezos' },
  { key: 'NEAR', src: '/logos/near.png', alt: 'NEAR' },
];

const baseDexToolLogos: LogoItem[] = [
  { key: 'CoinMarketCap', src: '/logos/cmc.png', alt: 'CoinMarketCap' },
  { key: 'CoinGecko', src: '/logos/coingecko-logo.png', alt: 'CoinGecko' },
  { key: 'PancakeSwap', src: '/logos/pancakeswap-logo.png', alt: 'PancakeSwap' },
  { key: 'Raydium', src: '/logos/Raydium.png', alt: 'Raydium' },
  { key: 'Dexscreener', src: '/logos/dexscreener.png', alt: 'Dexscreener' },
  { key: 'DexTools', src: '/logos/dextools.png', alt: 'DexTools' },
  { key: 'BirdEye', src: '/logos/birdeye.png', alt: 'Birdeye' },
  { key: 'Axiom', src: '/logos/axiom.jpeg', alt: 'Axiom' },
  { key: 'BubbleMaps', src: '/logos/bubblemaps.png', alt: 'BubbleMaps' },
  { key: 'Gecko', src: '/logos/gecko.png', alt: 'GeckoTerminal' },
  { key: 'GMGN', src: '/logos/gmgn.png', alt: 'GMGN' },
  { key: 'Photon', src: '/logos/photon.png', alt: 'Photon' },
  { key: 'RugCheck', src: '/logos/rugcheck.jpg', alt: 'RugCheck' },
  { key: 'PumpFun', src: '/logos/pumpfun-logo.png', alt: 'Pump.fun' },
  { key: 'Meteora', src: '/logos/meteora-logo.png', alt: 'Meteora' },
  { key: 'Jupiter', src: '/logos/jupiter.jpg', alt: 'Jupiter' },
];

function MarqueeRow({
  items,
  durationSeconds,
}: {
  items: LogoItem[];
  durationSeconds: number;
}) {
  const trackItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="logos-marquee-row" aria-hidden="true">
      <div
        className="logos-marquee-track"
        style={{ ['--logos-marquee-duration' as never]: `${durationSeconds}s` }}
      >
        {trackItems.map((l, idx) => (
          <div key={`${l.key}-${idx}`} className="logos-marquee-tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.src} alt={l.alt} className="logos-marquee-img" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogosMarqueeSection() {
  const [chainLogos, setChainLogos] = useState(baseChainLogos);
  const [dexToolLogos] = useState(baseDexToolLogos);

  useEffect(() => {
    setChainLogos(shuffle(baseChainLogos));
  }, []);

  return (
    <section className="logos-marquee-section">
      <div className="logos-marquee-fullwidth logos-marquee-content">
        <div className="logos-marquee-header">
          <div className="logos-marquee-kicker">
            <span className="logos-marquee-kicker-dot" />
            Supported Markets
          </div>
          <h2 className="logos-marquee-title">Assets + DEX ecosystem</h2>
          <p className="logos-marquee-subtitle">
            Flownomo supports multi-asset trading with oracle-backed prices and integrates with popular DEX tooling.
          </p>
        </div>

        <MarqueeRow items={chainLogos} durationSeconds={28} />
        <MarqueeRow items={dexToolLogos} durationSeconds={18} />
      </div>
    </section>
  );
}
