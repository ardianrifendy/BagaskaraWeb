import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdnpro.eraspace.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/predict",
        destination: "/prediction",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
