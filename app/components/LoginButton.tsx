'use client';

import { useRouter } from 'next/navigation';

interface LoginButtonProps {
  provider: 'kakao' | 'google' | 'apple';
}

export default function LoginButton({ provider }: LoginButtonProps) {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        router.push('/home');
        return;
      }
      // TODO: implement provider-based OAuth login
      router.push('/home');
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
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