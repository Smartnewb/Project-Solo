'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  university: string;
  department: string;
  studentId: string;
  height: string;
  personalities: string[];
  datingStyles: string[];
  idealLifestyles: string[];
  interests: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
}

export default function SettingsProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    // 온보딩 데이터 가져오기
    const onboardingData = localStorage.getItem('onboardingProfile');
    // 프로필 데이터 가져오기
    const profileInfo = localStorage.getItem('profile');

    if (onboardingData && profileInfo) {
      const onboarding = JSON.parse(onboardingData);
      const profile = JSON.parse(profileInfo);
      
      setProfileData({
        university: onboarding.university || '',
        department: onboarding.department || '',
        studentId: onboarding.studentId || '',
        height: profile.height || '',
        personalities: profile.personalities || [],
        datingStyles: profile.datingStyles || [],
        idealLifestyles: profile.idealLifestyles || [],
        interests: profile.interests || [],
        drinking: profile.drinking || '',
        smoking: profile.smoking || '',
        tattoo: profile.tattoo || '',
      });
    }
  }, []);

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="card">
            <p className="text-center text-gray-600">프로필 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* 학교 정보 */}
        <div className="card">
          <h2 className="text-h2">학교 정보</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-h3">대학교</h3>
              <p className="text-gray-700">{profileData.university || '미입력'}</p>
            </div>
            <div>
              <h3 className="text-h3">학과</h3>
              <p className="text-gray-700">{profileData.department || '미입력'}</p>
            </div>
            <div>
              <h3 className="text-h3">학번</h3>
              <p className="text-gray-700">{profileData.studentId || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="card">
          <h2 className="text-h2">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-h3">키</h3>
              <p className="text-gray-700">{profileData.height || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 성격 */}
        <div className="card">
          <h2 className="text-h2">성격</h2>
          <div className="flex flex-wrap gap-2">
            {profileData.personalities && profileData.personalities.length > 0 ? (
              profileData.personalities.map((personality, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {personality}
                </span>
              ))
            ) : (
              <p className="text-gray-500">선택된 성격이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 관심사 */}
        <div className="card">
          <h2 className="text-h2">관심사</h2>
          <div className="flex flex-wrap gap-2">
            {profileData.interests && profileData.interests.length > 0 ? (
              profileData.interests.map((interest, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-gray-500">선택된 관심사가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 연애 스타일 */}
        <div className="card">
          <h2 className="text-h2">연애 스타일</h2>
          <div className="flex flex-wrap gap-2">
            {profileData.datingStyles && profileData.datingStyles.length > 0 ? (
              profileData.datingStyles.map((style, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {style}
                </span>
              ))
            ) : (
              <p className="text-gray-500">선택된 연애 스타일이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 이상형 라이프스타일 */}
        <div className="card">
          <h2 className="text-h2">이상형의 라이프스타일</h2>
          <div className="flex flex-wrap gap-2">
            {profileData.idealLifestyles && profileData.idealLifestyles.length > 0 ? (
              profileData.idealLifestyles.map((lifestyle, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {lifestyle}
                </span>
              ))
            ) : (
              <p className="text-gray-500">선택된 라이프스타일이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="card">
          <h2 className="text-h2">추가 정보</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-h3">음주</h3>
              <p className="text-gray-700">{profileData.drinking || '미입력'}</p>
            </div>
            <div>
              <h3 className="text-h3">흡연</h3>
              <p className="text-gray-700">{profileData.smoking || '미입력'}</p>
            </div>
            <div>
              <h3 className="text-h3">문신</h3>
              <p className="text-gray-700">{profileData.tattoo || '미입력'}</p>
            </div>
          </div>
        </div>

        {/* 수정 버튼 */}
        <button
          onClick={() => {
            // 온보딩 데이터 저장
            localStorage.setItem('editProfileData', JSON.stringify(profileData));
            router.push('/profile');
          }}
          className="btn-primary w-full"
        >
          프로필 수정하기
        </button>
      </div>
    </div>
  );
} 