'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PreferenceOptions {
  ageRange: {
    min: number;
    max: number;
  };
  gender: string;
  personalities: string[];
  interests: string[];
  location: string;
}

const PreferencesSection = () => {
  const { user, profile } = useAuth();
  const [preferences, setPreferences] = useState<PreferenceOptions>({
    ageRange: { min: 20, max: 35 },
    gender: '',
    personalities: [],
    interests: [],
    location: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 선호 조건 로드
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch('/api/user-preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.preferences) {
            setPreferences(data.preferences);
          }
        }
      } catch (err) {
        console.error('선호 조건 로드 오류:', err);
      }
    };

    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  // 입력 필드 변경 처리
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'minAge' || name === 'maxAge') {
      const age = parseInt(value);
      setPreferences(prev => ({
        ...prev,
        ageRange: {
          ...prev.ageRange,
          [name === 'minAge' ? 'min' : 'max']: age,
        },
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 체크박스 변경 처리
  const handleCheckboxChange = (
    category: 'personalities' | 'interests',
    value: string,
    checked: boolean
  ) => {
    setPreferences(prev => {
      if (checked) {
        return {
          ...prev,
          [category]: [...prev[category], value],
        };
      } else {
        return {
          ...prev,
          [category]: prev[category].filter(item => item !== value),
        };
      }
    });
  };

  // 선호 조건 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '선호 조건 저장에 실패했습니다.');
      }

      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 성격 유형 목록
  const personalityOptions = [
    '활발한',
    '차분한',
    '사교적인',
    '내향적인',
    '창의적인',
    '논리적인',
    '감성적인',
    '실용적인',
    '모험적인',
    '안정적인',
  ];

  // 관심사 목록
  const interestOptions = [
    '영화',
    '음악',
    '여행',
    '맛집탐방',
    '독서',
    '게임',
    '스포츠',
    '요리',
    '예술',
    '기술',
    '패션',
    '건강',
    '반려동물',
    '재테크',
    '사진',
  ];

  // 지역 목록
  const locationOptions = [
    '서울',
    '부산',
    '인천',
    '대구',
    '대전',
    '광주',
    '울산',
    '세종',
    '경기',
    '강원',
    '충북',
    '충남',
    '전북',
    '전남',
    '경북',
    '경남',
    '제주',
  ];

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">매칭 선호 조건</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            편집
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          선호 조건이 성공적으로 저장되었습니다.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 연령대 설정 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">원하는 연령대</h3>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                name="minAge"
                value={preferences.ageRange.min}
                onChange={handleChange}
                min="18"
                max="100"
                className="w-20 border border-gray-300 rounded p-2"
              />
              <span>~</span>
              <input
                type="number"
                name="maxAge"
                value={preferences.ageRange.max}
                onChange={handleChange}
                min={preferences.ageRange.min}
                max="100"
                className="w-20 border border-gray-300 rounded p-2"
              />
              <span className="text-sm text-gray-500">세</span>
            </div>
          </div>

          {/* 성별 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">선호하는 성별</h3>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={preferences.gender === 'male'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">남성</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={preferences.gender === 'female'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">여성</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value=""
                  checked={preferences.gender === ''}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">상관없음</span>
              </label>
            </div>
          </div>

          {/* 지역 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">선호하는 지역</h3>
            <select
              name="location"
              value={preferences.location}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">상관없음</option>
              {locationOptions.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* 성격 유형 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">선호하는 성격 유형</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {personalityOptions.map(personality => (
                <label key={personality} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.personalities.includes(personality)}
                    onChange={e =>
                      handleCheckboxChange('personalities', personality, e.target.checked)
                    }
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">{personality}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 관심사 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">공통 관심사</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interestOptions.map(interest => (
                <label key={interest} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.interests.includes(interest)}
                    onChange={e =>
                      handleCheckboxChange('interests', interest, e.target.checked)
                    }
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        // 저장된 선호 조건 표시
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">연령대</h3>
                <p className="mt-1">
                  {preferences.ageRange.min} ~ {preferences.ageRange.max}세
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">성별</h3>
                <p className="mt-1">
                  {preferences.gender === 'male'
                    ? '남성'
                    : preferences.gender === 'female'
                    ? '여성'
                    : '상관없음'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">지역</h3>
                <p className="mt-1">{preferences.location || '상관없음'}</p>
              </div>
            </div>
          </div>

          {preferences.personalities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">선호하는 성격 유형</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.personalities.map(personality => (
                  <span
                    key={personality}
                    className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                  >
                    {personality}
                  </span>
                ))}
              </div>
            </div>
          )}

          {preferences.interests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">공통 관심사</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.interests.map(interest => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {preferences.personalities.length === 0 && preferences.interests.length === 0 && (
            <p className="text-gray-500 italic">
              아직 선호하는 성격 유형이나 관심사를 설정하지 않았습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PreferencesSection; 