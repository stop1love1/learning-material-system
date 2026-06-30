import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained .next/standalone server for a lean Docker image.
  output: "standalone",
};

export default nextConfig;
