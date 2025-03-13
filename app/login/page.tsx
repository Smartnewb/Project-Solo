import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 관리자 계정인 경우에만 처리
    if (email === 'admin@smartnewbie.com') {
      try {
        console.log('관리자 로그인 시도...');
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('관리자 로그인 에러:', signInError);
          throw signInError;
        }

        if (!data.user) {
          console.error('관리자 사용자 데이터 없음');
          throw new Error('로그인에 실패했습니다.');
        }

        console.log('관리자 로그인 성공:', data.user);

        // 관리자 권한 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('관리자 프로필 조회 에러:', profileError);
          throw profileError;
        }

        if (!profile || profile.role !== 'admin') {
          console.error('관리자 권한 없음:', profile);
          throw new Error('관리자 권한이 없습니다.');
        }

        console.log('관리자 권한 확인 완료:', profile);
        router.push('/admin');
        return;
      } catch (error) {
        console.error('관리자 로그인 처리 중 에러:', error);
        setError('관리자 로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        return;
      }
    }

    // 일반 사용자 로그인 처리
    try {
      console.log('일반 사용자 로그인 시도...');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('일반 사용자 로그인 에러:', signInError);
        throw signInError;
      }

      if (!data.user) {
        console.error('일반 사용자 데이터 없음');
        throw new Error('로그인에 실패했습니다.');
      }

      console.log('일반 사용자 로그인 성공:', data.user);
      router.push('/');
    } catch (error) {
      console.error('일반 사용자 로그인 처리 중 에러:', error);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">로그인</h1>
        
        {error && (
          <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-20 outline-none transition-colors"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-20 outline-none transition-colors"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#4A90E2] text-white py-3 rounded-xl hover:bg-[#357ABD] transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
} 