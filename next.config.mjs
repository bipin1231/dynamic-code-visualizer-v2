/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Add Monaco Editor webpack configuration
    if (!isServer) {
      config.output.globalObject = 'self';
    }
    
    return config;
  },
}

export default nextConfig
