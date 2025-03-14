'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const supabase = createClientComponentClient();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('회원가입 시도:', { data: formData });
    e.preventDefault();
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