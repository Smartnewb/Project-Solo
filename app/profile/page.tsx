'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface PreferenceOption {
  id: string;
  displayName: string;
}

interface PreferenceType {
  typeName: string;
  options: PreferenceOption[];
  multiple: boolean;
  maximumChoiceCount: number;
}

interface ProfilePreferences {
  preferences: PreferenceType[];
}

interface ProfileData {
  id: string;
  userId: string;
  age: number;
  gender: string;
  name: string;
  title: string;
  introduction: string;
  statusAt: string | null;
  preferences: {
    typeName: string;
    selectedOptions: PreferenceOption[];
  }[];
}

interface ProfileForm {
  [key: string]: string[];  // 동적 키를 위한 인덱스 시그니처 추가
}

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [preferences, setPreferences] = useState<PreferenceType[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileForm>({});

  // 선택 가능한 옵션들과 저장된 프로필 정보를 가져오는 함수
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('토큰이 없습니다.');
        router.push('/');
        return;
      }

      // 선택 가능한 옵션들 조회
      const preferencesResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!preferencesResponse.ok) {
        if (preferencesResponse.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('선택 옵션 조회 실패');
      }

      const preferencesData: PreferenceType[] = await preferencesResponse.json();
      console.log('Fetched preferences:', preferencesData);
      setPreferences(preferencesData);

      // 저장된 프로필 정보 조회
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profile: ProfileData = await profileResponse.json();
        setProfileData(profile);
        console.log('Fetched profile:', profile);

        // 새로운 API 응답 구조에 맞게 formData 설정
        const newFormData: ProfileForm = {};
        
        // profile.preferences에서 각 타입별로 선택된 옵션들을 formData에 설정
        profile.preferences.forEach(pref => {
          newFormData[pref.typeName] = pref.selectedOptions.map(option => option.displayName);
        });

        console.log('Setting formData:', newFormData);
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('데이터 조회 중 오류:', error);
      showTemporaryModal('데이터 조회 중 오류가 발생했습니다.', 'error');
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.log('인증된 사용자가 없습니다. 로그인 페이지로 이동합니다.');
      router.push('/');
      return;
    }

    fetchData();
  }, [user, loading, router]);

  const showTemporaryModal = (message: string, type: 'success' | 'error' = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showTemporaryModal('로그인이 필요합니다.', 'error');
        router.push('/');
        return;
      }

      // 선택된 옵션들의 ID를 찾아서 저장
      const selectedPreferences = preferences.map(preferenceType => ({
        typeName: preferenceType.typeName,
        optionIds: preferenceType.options
          .filter(option => formData[preferenceType.typeName]?.includes(option.displayName))
          .map(option => option.id)
      })).filter(pref => pref.optionIds.length > 0);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: selectedPreferences })
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || '프로필 저장 실패');
      }

      showTemporaryModal('프로필이 성공적으로 저장되었습니다.', 'success');
      router.push('/ideal-type');
    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      showTemporaryModal('프로필 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMultiSelect = (category: keyof ProfileForm, value: string, maxCount: number) => {
    setFormData(prev => {
      const currentArray = prev[category] as string[];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [category]: currentArray.filter(item => item !== value)
        };
      }
      if (currentArray.length >= maxCount) {
        showTemporaryModal(`최대 ${maxCount}개까지 선택 가능합니다`);
        return prev;
      }
      return {
        ...prev,
        [category]: [...currentArray, value]
      };
    });
  };

  const handleSingleSelect = (category: keyof ProfileForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: [value]
    }));
  };

  const getOptionsForType = (typeName: string): PreferenceOption[] => {
    if (!preferences) {
      return [];
    }
    const preferenceType = preferences.find(p => p.typeName === typeName);
    return preferenceType?.options || [];
  };

  const getMaxSelectionsForType = (typeName: string): number => {
    const preferenceType = preferences.find(p => p.typeName === typeName);
    return preferenceType?.maximumChoiceCount || 1;
  };

  // 데이터 로딩 중이거나 preferences가 없으면 로딩 표시
  if (loading || !preferences.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // preferences가 있는지 확인
  const hasPreferences = preferences.length > 0;
  if (!hasPreferences) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">선택 가능한 옵션을 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center mb-8">
            <button 
              onClick={() => router.push('/home')} 
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-all"
              aria-label="뒤로 가기"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {preferences.map((preferenceType) => (
              <div key={preferenceType.typeName} className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {preferenceType.typeName}
                  </h2>
                  {preferenceType.multiple && preferenceType.maximumChoiceCount > 1 && (
                    <span className="text-sm text-gray-500">
                      최대 {preferenceType.maximumChoiceCount}개 선택 가능
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {preferenceType.options.map((option) => {
                    const isSelected = formData[preferenceType.typeName]?.includes(option.displayName);
                    const currentSelections = formData[preferenceType.typeName]?.length || 0;
                    const maxSelections = preferenceType.maximumChoiceCount;
                    const canSelect = !isSelected && (!maxSelections || currentSelections < maxSelections);

                    return (
                      <div
                        key={option.id}
                        onClick={() => {
                          if (preferenceType.multiple) {
                            if (isSelected) {
                              const newValue = (formData[preferenceType.typeName] || [])
                                .filter(v => v !== option.displayName);
                              setFormData({
                                ...formData,
                                [preferenceType.typeName]: newValue
                              });
                            } else if (canSelect) {
                              const newValue = [
                                ...(formData[preferenceType.typeName] || []),
                                option.displayName
                              ];
                              setFormData({
                                ...formData,
                                [preferenceType.typeName]: newValue
                              });
                            } else {
                              showTemporaryModal(`최대 ${maxSelections}개까지 선택 가능합니다.`);
                            }
                          } else {
                            setFormData({
                              ...formData,
                              [preferenceType.typeName]: [option.displayName]
                            });
                          }
                        }}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer
                          ${isSelected
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                            : canSelect
                              ? 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                              : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        {option.displayName}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full md:w-1/2 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-xl shadow-sm hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
            <p className="text-center text-gray-800">{modalMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}   