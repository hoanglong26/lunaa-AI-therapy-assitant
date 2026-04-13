import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Transformers.js runs in the browser via Web Worker.
    // Prevent Next.js from trying to bundle server-only ONNX/sharp packages.
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
