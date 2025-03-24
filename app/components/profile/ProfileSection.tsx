'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const ProfileSection = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    gender: '',
    // bio: '',
    interests: [''],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 프로필 데이터 로드
  useEffect(() => {
    if (profile) {
      setFormData({
        nickname: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        // bio: profile.bio || '',
        interests: profile.interests || [''],
      });
    }
  }, [profile]);

  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 관심사 추가
  const addInterest = () => {
    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, ''],
    }));
  };

  // 관심사 입력 처리
  const handleInterestChange = (index: number, value: string) => {
    const newInterests = [...formData.interests];
    newInterests[index] = value;
    setFormData(prev => ({
      ...prev,
      interests: newInterests,
    }));
  };

  // 관심사 삭제
  const removeInterest = (index: number) => {
    const newInterests = formData.interests.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      interests: newInterests.length ? newInterests : [''],
    }));
  };

  // 프로필 저장 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로필 업데이트에 실패했습니다.');
      }

      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">기본 정보</h2>
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
          프로필이 성공적으로 업데이트되었습니다.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              나이
            </label>
            <input
              type="number"
              id="age"
              name="age"
              min="18"
              max="100"
              value={formData.age}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              성별
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              자기소개
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관심사
            </label>
            {formData.interests.map((interest, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={interest}
                  onChange={(e) => handleInterestChange(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="관심사 입력"
                />
                <button
                  type="button"
                  onClick={() => removeInterest(index)}
                  className="ml-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addInterest}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + 관심사 추가
            </button>
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
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="mr-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="프로필 이미지"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    사진 없음
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{profile?.name || '닉네임 미설정'}</h3>
              <div className="mt-1 text-sm text-gray-500">
                {profile?.email}
              </div>

              <div className="mt-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">나이:</span>{' '}
                    <span>{profile?.age || '미설정'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">성별:</span>{' '}
                    <span>
                      {profile?.gender
                        ? profile.gender === 'male'
                          ? '남성'
                          : profile.gender === 'female'
                          ? '여성'
                          : '기타'
                        : '미설정'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* {profile?.bio && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">자기소개</h4>
              <p className="text-sm">{profile.bio}</p>
            </div>
          )} */}

          {profile?.interests && profile.interests.length > 0 && profile.interests[0] !== '' && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">관심사</h4>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSection; 