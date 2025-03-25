/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Vercel 배포에서 정적 생성 오류를 해결하기 위한 설정
  output: 'standalone',
  experimental: {
    // 서버 컴포넌트에서 쿠키 사용 오류 해결
    serverActionsBodySizeLimit: '2mb',
  },
};

module.exports = nextConfig; 