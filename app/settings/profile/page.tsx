'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// 로딩 컴포넌트
const Loader = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function getProfileData() {
      try {
        setLoading(true);
        
        // 현재 로그인된 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('사용자 인증 정보가 없습니다.');
          router.push('/login');
          return;
        }
        
        // 프로필 정보 가져오기
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(profileData);
        
      } catch (error) {
        console.error('프로필 데이터 로딩 중 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getProfileData();
  }, [supabase, router]);

  if (loading) return <Loader />;
  if (!profile) return <div>프로필 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-all"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">내 프로필</h1>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 mr-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="프로필 사진"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100">
                  <svg
                    className="w-12 h-12 text-purple-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">기본 정보</h2>
              <p className="text-sm text-gray-500">
                {profile.name || '이름 미입력'} · {profile.age || '나이 미입력'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">이름</p>
              <p className="font-medium">{profile.name || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">나이</p>
              <p className="font-medium">{profile.age || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">성별</p>
              <p className="font-medium">{profile.gender || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">MBTI</p>
              <p className="font-medium">{profile.mbti || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">키</p>
              <p className="font-medium">{profile.height ? `${profile.height}cm` : '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">인스타그램</p>
              <p className="font-medium">{profile.instagram_id || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 학교 정보 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">학교 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">대학교</p>
              <p className="font-medium">{profile.university || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">학과</p>
              <p className="font-medium">{profile.department || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">학번</p>
              <p className="font-medium">{profile.student_id || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">학년</p>
              <p className="font-medium">{profile.grade || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 성격 및 취향 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">성격 및 취향</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm mb-2">성격</p>
              <div className="flex flex-wrap gap-2">
                {profile.personalities?.length > 0 ? (
                  profile.personalities.map((item: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">미입력</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2">데이트 스타일</p>
              <div className="flex flex-wrap gap-2">
                {profile.dating_styles?.length > 0 ? (
                  profile.dating_styles.map((item: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">미입력</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 생활 습관 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">생활 습관</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">흡연</p>
              <p className="font-medium">{profile.smoking || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">음주</p>
              <p className="font-medium">{profile.drinking || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">타투</p>
              <p className="font-medium">{profile.tattoo || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/onboarding')}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            프로필 수정하기
          </button>
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
