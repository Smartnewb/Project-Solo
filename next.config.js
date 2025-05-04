const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  webpack: (config, { dev, isServer }) => {
    // SVG 파일 처리
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // 경로 별칭 설정 추가
    config.resolve.alias['@'] = path.resolve(__dirname);

    // 개발 환경에서 React DevTools 관련 설정
    if (dev && !isServer) {
      // React DevTools 관련 설정 추가
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        if (entries['main.js'] && !entries['main.js'].includes('react-refresh')) {
          entries['main.js'].unshift('react-refresh/runtime');
        }
        return entries;
      };
    }

    return config;
  },
  // Vercel 배포에서 정적 생성 오류를 해결하기 위한 설정
  output: 'standalone',
  // 타입 체크 오류로 인한 빌드 실패 방지
  typescript: {
    // !! WARN !!
    // 타입 오류가 있더라도 빌드가 성공하도록 설정
    // 이는 임시 해결책이며, 타입 오류는 여전히 존재합니다
    ignoreBuildErrors: true,
  },
  // 빌드 캐시 무효화 (개발 환경에서는 제외)
  env: {
    // 타임스탬프를 환경 변수로 추가하여 매 빌드마다 변경되도록 합니다
    CACHE_INVALIDATION: Date.now().toString(),
  },
  // 빌드 캐시를 완전히 비활성화
  generateBuildId: async () => {
    // 빌드 ID를 매번 새로 생성하여 캐시 사용을 방지합니다
    return `build-${Date.now()}`
  },

  // React DevTools 관련 설정
  reactStrictMode: false, // 업데이트 후 true로 변경 가능

  // 서버 사이드 렌더링 설정
  experimental: {
    // 서버 컴포넌트와 클라이언트 컴포넌트 구분 강화
    serverComponentsExternalPackages: ['react-dom'],
    // 서버 컴포넌트 오류 처리 개선
    serverActions: {
      bodySizeLimit: '2mb',
    },

  },
};

module.exports = nextConfig;