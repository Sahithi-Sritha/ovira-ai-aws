import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for faster builds
  experimental: {
    // Optimize package imports for faster cold starts
    optimizePackageImports: ['lucide-react', 'date-fns', '@react-pdf/renderer'],
  },
  // Reduce source map overhead in development
  productionBrowserSourceMaps: false,
  // Skip type checking during build (run separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during development (run separately)
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
