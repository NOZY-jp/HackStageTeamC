import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // 開発サーバーを LAN の別端末から開くときの許可（例: DEV_ALLOWED_ORIGINS=192.168.0.10）。個人の IP をコードに書かない
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? [],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
