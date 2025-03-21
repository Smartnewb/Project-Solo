'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/utils/supabase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignupEnabled, setIsSignupEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // 회원가입 상태 확인
    const checkSignupStatus = async () => {
      try {
        const response = await fetch('/api/admin/signup-control');
        const data = await response.json();
        setIsSignupEnabled(data.isSignupEnabled);
      } catch (error) {
        console.error('회원가입 상태 확인 실패:', error);
        setIsSignupEnabled(false);
      }
    };

    checkSignupStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 회원가입이 비활성화된 경우
    if (!isSignupEnabled) {
      setError('현재 매칭이 진행 중이라 신규 회원가입을 받지 않고 있습니다. 다음 매칭 시간에 다시 시도해주세요.');
      return;
    }

    console.log('회원가입 시도:', { data: formData });
    setError(null);
    setLoading(true);

    // 입력값 검증
    if (!formData.email || !formData.password || !formData.name || !formData.age || !formData.gender) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 1. 회원가입 시도
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender
          }
        }
      });

      if (signUpError) {
        console.error('회원가입 에러:', signUpError);
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (!signUpData.user) {
        setError('회원가입 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      console.log({ signUpData });

      // 2. 자동 로그인 처리
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        console.error('로그인 에러:', loginError);
        setError('회원가입 후 로그인 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      // 3. 프로필 정보 저장
      localStorage.setItem(`onboarding_profile_${signUpData.user.id}`, JSON.stringify({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        interests: []
      }));

      // 4. 이메일 인증 안내 메시지 제거 및 온보딩 페이지로 바로 이동
      router.push('/onboarding');
    } catch (err) {
      console.error('예상치 못한 에러:', err);
      setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 상태 로딩 중
  if (isSignupEnabled === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 회원가입이 비활성화된 경우
  if (!isSignupEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-h2 ml-2">회원가입</h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4">
          <div className="card p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-600">회원가입 일시 중단</h2>
            <p className="text-gray-600">
              현재 매칭이 진행 중이라 신규 회원가입을 받지 않고 있습니다.<br />
              다음 매칭 시간에 다시 시도해주세요.
            </p>
            <Link href="/" className="btn-primary inline-block">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <h1 className="text-h2 ml-2">회원가입</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                나이
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                성별
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">선택해주세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}