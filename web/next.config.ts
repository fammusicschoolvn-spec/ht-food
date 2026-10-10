import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thư mục dữ liệu cố định theo vị trí dự án, không phụ thuộc nơi gõ lệnh chạy.
  env: { HT_DATA_DIR: process.env.HT_DATA_DIR ?? path.join(__dirname, "data") },
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
