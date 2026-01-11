import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // No special webpack config needed - using direct REST API calls instead of SDK
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
