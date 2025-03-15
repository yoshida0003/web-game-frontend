import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
};

export default nextConfig;

module.exports = {
  env: {
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE,
    NEXT_PUBLIC_API_URL_PROD: process.env.NEXT_PUBLIC_API_URL_PROD,
    NEXT_PUBLIC_API_URL_DEV: process.env.NEXT_PUBLIC_API_URL_DEV,
  },
};