'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 로딩 컴포넌트
const Loader = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

interface ProfileData {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  profileImages: Array<{
    id: string;
    order: number;
    isMain: boolean;
    url: string;
  }>;
  universityDetails: {
    name: string;
    authentication: boolean;
    department: string;
  } | null;
  preferences: Array<{
    typeName: string;
    selectedOptions: Array<{
      id: string;
      displayName: string;
    }>;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    async function getProfileData() {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('인증 토큰이 없습니다.');
          router.push('/');
          return;
        }

        // 프로필 정보 가져오기
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/');
            return;
          }
          throw new Error('프로필 조회 실패');
        }

        const profileData = await response.json();
        setProfile(profileData);
        
      } catch (error) {
        console.error('프로필 데이터 로딩 중 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getProfileData();
  }, [router]);

  if (loading) return <Loader />;
  if (!profile) return <div>프로필 정보를 찾을 수 없습니다.</div>;

  // 선호도 옵션에서 특정 타입의 옵션들을 찾는 헬퍼 함수
  const getPreferencesByType = (typeName: string) => {
    const preferenceGroup = profile.preferences.find(p => p.typeName === typeName);
    return preferenceGroup?.selectedOptions.map(option => option.displayName) || [];
  };

  // 각 선호도 옵션 가져오기
  const personalities = getPreferencesByType('성격 유형');
  const datingStyles = getPreferencesByType('연애 스타일');
  const lifestyles = getPreferencesByType('라이프스타일');
  const interests = getPreferencesByType('관심사');
  const drinking = getPreferencesByType('음주 선호도')[0];
  const smoking = getPreferencesByType('흡연 선호도')[0];
  const tattoo = getPreferencesByType('문신 선호도')[0];
  const mbti = getPreferencesByType('MBTI 유형')[0];
  const agePreference = getPreferencesByType('선호 나이대')[0];

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
          <h2 className="text-xl font-bold mb-4">기본 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">이름</p>
              <p className="font-medium">{profile.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">나이</p>
              <p className="font-medium">{profile.age}세</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">성별</p>
              <p className="font-medium">{profile.gender === 'MALE' ? '남성' : '여성'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">MBTI</p>
              <p className="font-medium">{mbti || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 학교 정보 */}
        {profile.universityDetails && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">학교 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">대학교</p>
                <p className="font-medium">{profile.universityDetails.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">학과</p>
                <p className="font-medium">{profile.universityDetails.department}</p>
              </div>
            </div>
          </div>
        )}

        {/* 관심사 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">관심사</h2>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? (
              interests.map((item, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-gray-400">미입력</span>
            )}
          </div>
        </div>

        {/* 성격 및 연애 스타일 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">성격 및 연애 스타일</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm mb-2">성격</p>
              <div className="flex flex-wrap gap-2">
                {personalities.length > 0 ? (
                  personalities.map((item, index) => (
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
              <p className="text-gray-500 text-sm mb-2">연애 스타일</p>
              <div className="flex flex-wrap gap-2">
                {datingStyles.length > 0 ? (
                  datingStyles.map((item, index) => (
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

        {/* 라이프스타일 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">라이프스타일</h2>
          <div className="flex flex-wrap gap-2">
            {lifestyles.length > 0 ? (
              lifestyles.map((item, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-gray-400">미입력</span>
            )}
          </div>
        </div>

        {/* 선호도 정보 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">선호도 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">흡연</p>
              <p className="font-medium">{smoking || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">음주</p>
              <p className="font-medium">{drinking || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">문신</p>
              <p className="font-medium">{tattoo || '미입력'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">선호 나이대</p>
              <p className="font-medium">{agePreference || '미입력'}</p>
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
