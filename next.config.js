/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http:; connect-src 'self' https: http: wss: ws:; font-src 'self' data: https:; frame-src 'self' https:;",
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
      // Scoped proxies for client-side calls (replaces old catch-all /api-proxy/:path*).
      // Admin API calls from dashboard and other pages
      { source: '/api-proxy/admin/:path*', destination: `${backendUrl}/admin/:path*` },
      // Support chat admin calls
      { source: '/api-proxy/support-chat/:path*', destination: `${backendUrl}/support-chat/:path*` },
      // Community article calls
      { source: '/api-proxy/articles/:path*', destination: `${backendUrl}/articles/:path*` },
      { source: '/api-proxy/articles', destination: `${backendUrl}/articles` },
      // Auth calls
      { source: '/api-proxy/auth/:path*', destination: `${backendUrl}/auth/:path*` },
      // Profile calls
      { source: '/api-proxy/profile/:path*', destination: `${backendUrl}/profile/:path*` },
      { source: '/api-proxy/profile', destination: `${backendUrl}/profile` },
      // University calls
      { source: '/api-proxy/universities/:path*', destination: `${backendUrl}/universities/:path*` },
      { source: '/api-proxy/universities', destination: `${backendUrl}/universities` },
      // Matching calls
      { source: '/api-proxy/matching/:path*', destination: `${backendUrl}/matching/:path*` },
      { source: '/api-proxy/matching', destination: `${backendUrl}/matching` },
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
