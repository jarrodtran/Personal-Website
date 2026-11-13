import type { NextConfig } from "next";
import { normalizeBasePath } from "./lib/base-path";

const basePath = normalizeBasePath(process.env.BASE_PATH);

const nextConfig: NextConfig = {
  output: "export",
  distDir:
    process.env.WRITING_FIXTURE_EXPORT === "1"
      ? "out.writing-fixture"
      : ".next",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Lightning CSS rewrites light-dark() inside custom properties into a
    // broken var() pair. Leave the function in the shipped CSS.
    lightningCssFeatures: {
      exclude: ["light-dark"],
    },
  },
};

export default nextConfig;
