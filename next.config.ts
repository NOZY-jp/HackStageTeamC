import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // 開発サーバーを LAN の別端末から開くときの許可（例: DEV_ALLOWED_ORIGINS=192.168.0.10）。個人の IP をコードに書かない
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? [],
  cacheComponents: true,
  // 写真コンテストの結果ページは、ブログの中から主催者のサイトへ移した（#222）。
  // 実在の Google 検索（#77）で古い URL に届いても新しいページへ行けるよう、恒久的に転送する
  async redirects() {
    return [
      {
        source: "/pochiblo/denden0102/contest/soukyuu-photo-award-2020",
        destination: "/soukyuu-photo/2018/result",
        permanent: true,
      },
    ];
  },
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
