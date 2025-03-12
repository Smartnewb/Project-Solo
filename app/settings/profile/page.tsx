'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Profile {
  name: string;
  age: string;
  gender: string;
  location: string;
  occupation: string;
  introduction: string;
  interests: string[];
}

export default function ProfileEdit() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<Profile>({
    name: '',
    age: '',
    gender: '',
    location: '',
    occupation: '',
    introduction: '',
    interests: []
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }

        // 온보딩에서 저장한 프로필 정보 가져오기
        const onboardingProfile = localStorage.getItem(`onboarding_profile_${user.id}`);
        if (onboardingProfile) {
          const parsedProfile = JSON.parse(onboardingProfile);
          setProfile(prev => ({
            ...prev,
            ...parsedProfile
          }));
        }
      } catch (error) {
        console.error('프로필 로딩 에러:', error);
      }
    };

    loadProfile();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // 프로필 정보 저장
      localStorage.setItem(`onboarding_profile_${user.id}`, JSON.stringify(profile));
      router.push('/settings');
    } catch (error) {
      console.error('프로필 저장 에러:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value.trim()) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, value.trim()]
      }));
      e.target.value = '';
    }
  };

  const removeInterest = (index: number) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-h2 ml-2">프로필 수정</h1>
          </div>
        </div>
      </div>

      {/* 프로필 수정 폼 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
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
                value={profile.age}
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
                value={profile.gender}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">선택해주세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                지역
              </label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                직업
              </label>
              <input
                type="text"
                name="occupation"
                value={profile.occupation}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                자기소개
              </label>
              <textarea
                name="introduction"
                value={profile.introduction}
                onChange={handleChange}
                className="input-field"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                관심사 (엔터로 추가)
              </label>
              <input
                type="text"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInterestChange(e as any);
                  }
                }}
                className="input-field"
                placeholder="관심사를 입력하고 엔터를 눌러주세요"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-primary-50 text-primary-DEFAULT px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(index)}
                      className="text-primary-DEFAULT hover:text-primary-dark"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            저장하기
          </button>
        </form>
      </div>
    </div>
  );
} 