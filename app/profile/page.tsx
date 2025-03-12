'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [mbti, setMbti] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (profile) {
      setNickname(profile.nickname || '');
      setBio(profile.bio || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || 'male');
      setHeight(profile.height || '');
      setMbti(profile.mbti || '');
      setInterests(profile.interests || []);
    }
  }, [user, profile, router]);

  const interestOptions = [
    '영화', '음악', '독서', '게임', '운동', 
    '요리', '여행', '사진', '패션', '카페',
    '공연', '전시', '반려동물', '등산', '자전거'
  ];

  const heightOptions = [
    '~155cm', '156~160cm', '161~165cm', '166~170cm',
    '171~175cm', '176~180cm', '181~185cm', '186cm~'
  ];

  const mbtiTypes = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
  ];

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    if (!nickname || !university || !major || !age || !height || !mbti) {
      setError('모든 필수 항목을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updateProfile({
        nickname,
        bio,
        university,
        major,
        age: parseInt(age),
        gender,
        height,
        mbti,
        interests
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            프로필 설정
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            매칭에 사용될 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임 *
              </label>
              <input
                id="nickname"
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                대학교 *
              </label>
              <input
                id="university"
                type="text"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="서울대학교"
              />
            </div>

            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700">
                전공 *
              </label>
              <input
                id="major"
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="컴퓨터공학과"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  나이 *
                </label>
                <input
                  id="age"
                  type="number"
                  required
                  min="19"
                  max="29"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  성별 *
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2 px-3 text-sm font-medium rounded-md ${
                      gender === 'male'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2 px-3 text-sm font-medium rounded-md ${
                      gender === 'female'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    여성
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                키 *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {heightOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHeight(option)}
                    className={`py-2 px-3 text-sm font-medium rounded-md ${
                      height === option
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MBTI *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {mbtiTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMbti(type)}
                    className={`py-2 px-3 text-sm font-medium rounded-md ${
                      mbti === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                자기소개
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="자신을 소개해주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관심사 (최대 5개)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    disabled={!interests.includes(interest) && interests.length >= 5}
                    className={`py-2 px-3 text-sm font-medium rounded-md ${
                      interests.includes(interest)
                        ? 'bg-indigo-600 text-white'
                        : interests.length >= 5
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    프로필이 성공적으로 업데이트되었습니다.
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 