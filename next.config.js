/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

    return [
      { source: '/api/admin/rematch-request', destination: `${backendUrl}/admin/matching/rematch-request` },
      { source: '/api/notifications/:path*', destination: `${backendUrl}/notifications/:path*` },
      { source: '/api/notifications', destination: `${backendUrl}/notifications` },
      { source: '/api/matchings/:path*', destination: `${backendUrl}/matchings/:path*` },
      { source: '/api/offline-meetings/:path*', destination: `${backendUrl}/offline-meetings/:path*` },
      { source: '/api/offline-meetings', destination: `${backendUrl}/offline-meetings` },
      { source: '/api/user-preferences', destination: `${backendUrl}/user-preferences` },
      { source: '/api/profile', destination: `${backendUrl}/profile` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sometimes-resources.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['react-dom'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
