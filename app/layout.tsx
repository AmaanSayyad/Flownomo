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
  metadataBase: new URL('https://flownomo.fun'),
  title: "Flownomo - Trade over 300+ Crypto, Stocks, Metals and Forex on Flow Network",
  description:
    "The first Flow-native binary options trading dapp. Powered by Flow Blockchain, Pyth Hermes price attestations, and minimal trust resolution.",
  keywords: [
    "binary options",
    "crypto trading",
    "Flow Network",
    "Flow Blockchain",
    "Pyth oracle",
    "Web3",
    "prediction",
  ],
  icons: {
    icon: "/overflowlogo.ico",
    shortcut: "/overflowlogo.ico",
    apple: "/overflowlogo.ico",
  },
  openGraph: {
    title: "Flownomo — Trade over 300+ Crypto, Stocks, Metals and Forex on Flow",
    description:
      "The first Flow-native binary options trading dapp. Powered by Flow Blockchain, Pyth Hermes price attestations, and minimal trust resolution.",
    images: [{ url: '/flow-flow-logo.png', width: 512, height: 512, alt: 'Flownomo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Flownomo — Trade over 300+ Crypto, Stocks, Metals and Forex on Flow",
    description: "Trade binary options on Flow Network with oracle-bound resolution.",
    images: ['/flow-flow-logo.png'],
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
