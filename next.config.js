/** @type {import('next').NextConfig} */

function toOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// Origins the browser may legitimately talk to: the API and the support-chat
// socket (socket.io needs both https and wss forms of its origin).
const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_URL);
const socketOrigin = toOrigin(process.env.NEXT_PUBLIC_SOCKET_URL);
const socketWsOrigin = socketOrigin ? socketOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') : null;
const allowedConnectOrigins = ["'self'", apiOrigin, socketOrigin, socketWsOrigin].filter(Boolean).join(' ');

const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  // unsafe-inline is still required for Next.js bootstrap scripts; unsafe-eval
  // is only needed by React Refresh in dev.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  isDev ? `connect-src ${allowedConnectOrigins} https: http: wss: ws:` : `connect-src ${allowedConnectOrigins}`,
  "font-src 'self' data: https:",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig = {
  async headers() {
    const headers = [
      {
        key: 'Content-Security-Policy',
        value: csp,
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
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
    ];
    if (!isDev) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }
    return [
      {
        source: '/(.*)',
        headers,
      },
    ];
  },
  async rewrites() {
    return [];
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
  serverExternalPackages: ['react-dom'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
