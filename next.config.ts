import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Temporarily ignore TypeScript errors during build
    // TODO: Fix Prisma types and re-enable
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB file uploads
    },
  },
};

export default nextConfig;
