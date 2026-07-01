import type { NextConfig } from "next";

// Backend chạy CHUNG container ở cổng nội bộ 3001. Trình duyệt gọi same-origin
// `/api/*`, Next proxy (rewrite) sang backend nội bộ → không cần expose backend.
const INTERNAL_API = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  // Produce a self-contained .next/standalone server for a lean Docker image.
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${INTERNAL_API}/api/:path*` },
    ];
  },
};

export default nextConfig;
