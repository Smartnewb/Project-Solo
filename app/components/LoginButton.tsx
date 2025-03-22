'use client';

import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface LoginButtonProps {
  provider: 'kakao' | 'google' | 'apple';
}

export default function LoginButton({ provider }: LoginButtonProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async () => {
    console.log('로그인 시도 중...', provider);
    
    try {
      // 테스트용 임시 로그인 (이메일/비밀번호 방식)
      const testEmail = 'test@example.com';
      const testPassword = 'password123';
      
      console.log('테스트 계정으로 로그인 시도:', testEmail);
      
      // 실제 로그인 대신 임시로 홈 페이지로 이동
      console.log('로그인 과정 생략, 홈으로 리다이렉트');
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