import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bynomo.fun'),
  title: "Bynomo - Trade over 300+ Crypto, Stocks, Metals and Forex with 5s-1m time-charts",
  description:
    "The first on-chain binary options trading dapp. Powered by Pyth Hermes price attestations, Supabase, and x402-style payments. Oracle-bound resolution, minimal trust.",
  keywords: [
    "binary options",
    "crypto trading",
    "Pyth oracle",
    "BNB",
    "Solana",
    "Sui",
    "Stellar",
    "Tezos",
    "NEAR",
    "Web3",
    "prediction",
  ],
  icons: {
    icon: "/overflowlogo.ico",
    shortcut: "/overflowlogo.ico",
    apple: "/overflowlogo.ico",
  },
  openGraph: {
    title: "Bynomo — Trade over 300+ Crypto, Stocks, Metals and Forex with 5s-1m time-charts",
    description:
      "The first on-chain binary options trading dapp. Powered by Pyth Hermes price attestations, Supabase, and x402-style payments. Oracle-bound resolution, minimal trust",
    images: [{ url: '/overflowlogo.png', width: 512, height: 512, alt: 'Bynomo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Bynomo — Trade over 300+ Crypto, Stocks, Metals and Forex with 5s-1m time-charts",
    description: "Trade binary options with oracle-bound resolution and minimal trust.",
    images: ['/overflowlogo.png'],
  },
};

import { Header } from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased bg-[#02040a] text-white h-screen overflow-hidden flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
