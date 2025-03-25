'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileForm {
  height: string;
  personalities: string[];
  datingStyles: string[];
  idealLifestyles: string[];
  interests: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
  mbti: string;
  instagramId?: string;
}

export default function Profile() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile, needsOnboarding } = useAuth();
  const supabase = createClientComponentClient();
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [formData, setFormData] = useState<ProfileForm>({
    height: '',
    personalities: [],
    datingStyles: [],
    idealLifestyles: [],
    interests: [],
    drinking: '',
    smoking: '',
    tattoo: '',
    mbti: '',
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.log('인증된 사용자가 없습니다. 로그인 페이지로 이동합니다.');
      router.push('/');
      return;
    }


    if (profile) {
      console.log('기존 프로필 데이터 로드:', profile);
      
      // 키 값 변환 함수
      const convertHeightToString = (height: number | null | undefined): string => {
        if (height === null || height === undefined) return '';
        
        if (height <= 160) return '160cm 이하';
        if (height <= 165) return '160cm~165cm';
        if (height <= 170) return '165cm~170cm';
        if (height <= 175) return '170cm~175cm';
        if (height <= 180) return '175cm~180cm';
        if (height <= 185) return '180cm~185cm';
        if (height <= 190) return '185cm~190cm';
        return '190cm 이상';
      };
      
      const heightString = convertHeightToString(profile.height);
      console.log('변환된 키 문자열:', heightString);
      
      setFormData({
        height: heightString,
        personalities: profile.personalities || [],
        datingStyles: profile.dating_styles || [],
        idealLifestyles: profile.ideal_lifestyles || [],
        interests: profile.interests || [],
        drinking: profile.drinking || '',
        smoking: profile.smoking || '',
        tattoo: profile.tattoo || '',
        mbti: profile.mbti || '',
      });
    }
  }, [user, profile, loading, router, needsOnboarding]);

  const showTemporaryModal = (message: string, type: 'success' | 'error' = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
    }, 3000);
  };

  const extractHeight = (heightStr: string): number | null => {
    if (!heightStr) return null;
    
    const numbers = heightStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;
    
    // 키 범위의 중간값을 사용하는 방식으로 변경
    if (heightStr === '160cm 이하') return 160;
    if (heightStr === '160cm~165cm') return 163;
    if (heightStr === '165cm~170cm') return 168;
    if (heightStr === '170cm~175cm') return 173;
    if (heightStr === '175cm~180cm') return 178;
    if (heightStr === '180cm~185cm') return 183;
    if (heightStr === '185cm~190cm') return 188;
    if (heightStr === '190cm 이상') return 190;
    
    // 기본 방식으로 처리
    if (heightStr.includes('~') && numbers.length >= 2) {
      // 범위의 중간값 사용
      const min = parseInt(numbers[0], 10);
      const max = parseInt(numbers[1], 10);
      return Math.floor((min + max) / 2);
    }
    
    if (heightStr.includes('이상') || heightStr.includes('+')) {
      return parseInt(numbers[0], 10);
    }
    
    if (heightStr.includes('이하') || heightStr.includes('-')) {
      return parseInt(numbers[0], 10);
    }
    
    return parseInt(numbers[0], 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showTemporaryModal('로그인이 필요합니다.', 'error');
      return;
    }
    
    if (!formData.height) {
      showTemporaryModal('키를 선택해주세요.', 'error');
      return;
    }
    
    if (formData.personalities.length === 0) {
      showTemporaryModal('성격을 하나 이상 선택해주세요.', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const height = extractHeight(formData.height);
      
      const additionalProfileData = {
        height,
        personalities: formData.personalities,
        dating_styles: formData.datingStyles,
        ideal_lifestyles: formData.idealLifestyles,
        interests: formData.interests,
        drinking: formData.drinking,
        smoking: formData.smoking,
        tattoo: formData.tattoo,
        mbti: formData.mbti,
      };
      
      console.log('저장할 프로필 데이터:', additionalProfileData);
      
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let result;
      
      if (checkError && checkError.code === 'PGRST116') {
        console.log('프로필이 없습니다. 새로 생성합니다.');
        
        result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...additionalProfileData,
          });
          
      } else if (!checkError) {
        console.log('기존 프로필을 업데이트합니다.');
        
        result = await supabase
          .from('profiles')
          .update(additionalProfileData)
          .eq('user_id', user.id);
      } else {
        throw checkError;
      }
      
      if (result.error) {
        console.error('프로필 저장 오류:', result.error);
        
        if (result.error.code === '23503') {
          showTemporaryModal('사용자 정보가 유효하지 않습니다. 다시 로그인해주세요.', 'error');
          return;
        }
        
        showTemporaryModal('프로필 저장 중 오류가 발생했습니다.', 'error');
        return;
      }
      
      console.log('프로필 저장 성공');
      
      await refreshProfile();
      
      showTemporaryModal('프로필이 저장되었습니다!', 'success');
      
      setTimeout(() => {
        router.push('/home');
      }, 3000);
      
    } catch (error) {
      console.error('프로필 저장 중 예외 발생:', error);
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
      [category]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.push('/home')} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-all"
            aria-label="뒤로 가기"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-h2">프로필 설정</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 키 선택 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">키</h2>
            <div className="grid grid-cols-2 gap-3">
              {['160cm 이하', '160cm~165cm', '165cm~170cm', '170cm~175cm', 
                '175cm~180cm', '180cm~185cm', '185cm~190cm', '190cm 이상'].map(height => {
                // 디버그 로그를 추가하여 현재 선택값과 비교할 값을 확인
                console.log(`현재 height 값: ${formData.height}, 비교할 값: ${height}, 일치하는가? ${formData.height === height}`);
                
                return (
                  <button
                    key={height}
                    type="button"
                    onClick={() => handleSingleSelect('height', height)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                      ${formData.height === height
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                  >
                    {height}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 성격 선택 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">성격 (최대 3개 선택)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['활발한', '차분한', '다정한', '감성적인', '이성적인', '웃긴', '진지한', 
                '열정적인', '낙천적인', '솔직한', '섬세한', '긍정적인'].map(personality => (
                <button
                  key={personality}
                  type="button"
                  onClick={() => handleMultiSelect('personalities', personality, 3)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.personalities.includes(personality)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {personality}
                </button>
              ))}
            </div>
          </div>
          
          {/* 연애 스타일 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">연애 스타일 (최대 2개 선택)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['연락 자주하는', '데이트 많이 하는', '취미 공유하는', '선물 좋아하는', 
                '집순인', '스킨십 많은', '이벤트 챙기는', '돈 잘 쓰는', '아껴쓰는'].map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleMultiSelect('datingStyles', style, 2)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.datingStyles.includes(style)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          
          {/* 이상적인 라이프스타일 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">이상적인 라이프스타일 (최대 3개 선택)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['여행 가능한', '맛집 탐방하는', '운동하는', '영화/넷플 보는', 
                '게임하는', '문화생활 즐기는', '집에서 쉬는', '야외활동 좋아하는'].map(lifestyle => (
                <button
                  key={lifestyle}
                  type="button"
                  onClick={() => handleMultiSelect('idealLifestyles', lifestyle, 3)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.idealLifestyles.includes(lifestyle)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {lifestyle}
                </button>
              ))}
            </div>
          </div>
          
          {/* 관심사 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">관심사 (최대 5개 선택)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['음악', '여행', '영화/드라마', '독서', '패션', '요리', 
                '카페', '운동', '게임', '반려동물', '사진', '미술/그림'].map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleMultiSelect('interests', interest, 5)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.interests.includes(interest)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          {/* 음주 여부 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">음주</h2>
            <div className="grid grid-cols-3 gap-3">
              {['안 마심', '가끔 마심', '자주 마심'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('drinking', option)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.drinking === option
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* 흡연 여부 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">흡연</h2>
            <div className="grid grid-cols-3 gap-3">
              {['비흡연', '가끔 흡연', '흡연'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('smoking', option)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.smoking === option
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* 타투 여부 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">타투</h2>
            <div className="grid grid-cols-3 gap-3">
              {['없음', '있음', '비공개'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('tattoo', option)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.tattoo === option
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* MBTI */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">MBTI</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 
                'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('mbti', option)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.mbti === option
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-sm hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </button>
        </form>
      </div>
      
      {/* 알림 모달 */}
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