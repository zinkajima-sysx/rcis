import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ['bcryptjs'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, {dev, isServer}) => {
    // Fix Windows EPERM: Restrict module resolution to project scope only.
    // Node.js global paths (C:\Users\Jin\.node_modules etc.) trigger EPERM
    // when scanning Windows junction points (Application Data, Cookies, etc.)

    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
