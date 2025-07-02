/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  experimental: {
    esmExternals: false,
  },
  webpack: (config, { isServer }) => {
    // Ignore optional WebSocket dependencies for client-side builds
    if (!isServer) {
      config.externals.push({
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    
    // Disable minification temporarily to avoid chunk corruption
    if (!isServer) {
      config.optimization.minimize = false;
    }
    
    return config;
  },
};

module.exports = nextConfig;