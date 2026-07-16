/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack(config, { dev }) {
    if (!dev) {
      config.cache = false;
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@supabase\/supabase-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /@supabase\/supabase-js/,
        message: /A Node\.js API is used .* which is not supported in the Edge Runtime/,
      },
    ];

    return config;
  },
};

module.exports = nextConfig;
