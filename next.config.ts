import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Standard ist 1 MB. Produktbilder (bis 2 MB) und Varianten-Sounds
      // (bis 3 MB) werden als multipart/form-data hochgeladen, deshalb
      // hier mehr Spielraum.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
