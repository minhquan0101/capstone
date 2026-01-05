import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const cors = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
    ];

    return [
      { source: "/api/:path*", headers: cors },
      { source: "/seatmaps/:path*", headers: cors },
      { source: "/uploads/:path*", headers: cors },
    ];
  },
};

export default nextConfig;
