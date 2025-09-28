/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  eslint: { 
    ignoreDuringBuilds: false 
  },
  typescript: { 
    ignoreBuildErrors: false 
  },
  output: 'standalone',
  transpilePackages: [
    '@aibos/accounting',
    '@aibos/accounting-contracts',
    '@aibos/accounting-web',
    '@aibos/contracts',
    '@aibos/ui',
    '@aibos/utils',
  ],
};

export default nextConfig;
