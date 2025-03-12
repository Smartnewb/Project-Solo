'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthError } from '@supabase/supabase-js';
import type { AuthResponse } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );

        if (error) {
          const authError = error as AuthError;
          console.error('Auth Error:', authError.message);
          router.push('/');
          return;
        }

        // 온보딩 완료 여부 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }

        // 로컬 스토리지에서 온보딩 완료 여부 확인
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
        
        if (hasCompletedOnboarding) {
          router.push('/home');
        } else {
          // 온보딩이 필요한 경우
          router.push('/onboarding');
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Callback Error:', error.message);
        } else {
          console.error('Callback Error: Unknown error occurred');
        }
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return null;
}