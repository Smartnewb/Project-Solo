'use client';

import { useRouter } from 'next/navigation';

interface LoginButtonProps {
  provider: 'kakao' | 'google' | 'apple';
}

export default function LoginButton({ provider }: LoginButtonProps) {
  const router = useRouter();

  const handleLogin = () => {
    // 임시로 바로 홈 페이지로 이동
    router.push('/home');
  };

  const getProviderStyle = () => {
    switch (provider) {
      case 'kakao':
        return 'bg-[#FEE500] text-black hover:bg-[#F6E000]';
      case 'google':
        return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
      case 'apple':
        return 'bg-black text-white hover:bg-gray-900';
      default:
        return '';
    }
  };

  const getProviderText = () => {
    switch (provider) {
      case 'kakao':
        return '카카오로 계속하기';
      case 'google':
        return 'Google로 계속하기';
      case 'apple':
        return 'Apple로 계속하기';
      default:
        return '';
    }
  };

  return (
    <button
      onClick={handleLogin}
      className={`w-full py-3 px-4 rounded-full font-medium transition-colors duration-200 ${getProviderStyle()}`}
    >
      {getProviderText()}
    </button>
  );
} 