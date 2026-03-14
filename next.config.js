/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://sometimes-resources.s3.ap-northeast-2.amazonaws.com; connect-src 'self'; font-src 'self' data:; frame-src 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

    return [
      // Catch-all proxy: routes client-side API calls through Next.js to avoid CORS
      // on Vercel Preview domains not whitelisted by the backend.
      { source: '/api-proxy/:path*', destination: `${backendUrl}/:path*` },
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
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['react-dom'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
