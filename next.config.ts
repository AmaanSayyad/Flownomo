import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignore TypeScript errors in near-docs folder during build
    ignoreBuildErrors: false,
  },
  // Empty turbopack config to silence warning
  turbopack: {},
};

export default nextConfig;
