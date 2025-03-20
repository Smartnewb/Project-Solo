'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { findBestMatch } from '@/app/matchingAlgorithm';

interface IdealTypeForm {
  heightRange: {
    min: number;
    max: number;
  };
  ageType: 'older' | 'younger' | 'same' | 'any';
  personalities: string[];
  datingStyles: string[];
  lifestyles: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
  interests: string[];
  likedMbti: string;
  dislikedMbti: string;
}

interface ValidationErrors {
  heightMin: boolean;
  heightMax: boolean;
  personalities: boolean;
  datingStyles: boolean;
  lifestyles: boolean;
  interests: boolean;
  drinking: boolean;
  smoking: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function IdealType() {
  const router = useRouter();
  const [formData, setFormData] = useState<IdealTypeForm>({
    heightRange: { min: 140, max: 200 },
    ageType: 'any',
    personalities: [],
    datingStyles: [],
    lifestyles: [],
    drinking: '',
    smoking: '',
    tattoo: '',
    interests: [],
    likedMbti: '',
    dislikedMbti: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    heightMin: false,
    heightMax: false,
    personalities: false,
    datingStyles: false,
    lifestyles: false,
    interests: false,
    drinking: false,
    smoking: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  const heightOptions = [
    '155cm 이하',
    '156~160cm',
    '161~165cm',
    '166~170cm',
    '171~175cm',
    '176cm 이상',
    '상관없음',
  ];

  const personalityOptions = [
    '활발한 성격',
    '조용한 성격',
    '배려심 많은 사람',
    '리더십 있는 사람',
    '유머 감각 있는 사람',
    '감성적인 사람',
    '모험을 즐기는 사람',
    '계획적인 스타일',
    '즉흥적인 스타일',
  ];

  const datingStyleOptions = [
    '적극적인 스타일',
    '다정다감한 스타일',
    '친구처럼 지내는 스타일',
    '츤데레 스타일',
    '상대방을 많이 챙기는 스타일',
    '표현을 잘 안 하지만 속은 다정한 스타일',
    '자유로운 연애를 선호하는 스타일',
    '자주 연락하는 걸 선호하는 스타일',
  ];

  const lifestyleOptions = [
    '아침형 인간',
    '밤형 인간',
    '집순이 / 집돌이',
    '여행을 자주 다니는 편',
    '운동을 즐기는 편',
    '게임을 자주 하는 편',
    '카페에서 노는 걸 좋아함',
    '액티비티 활동을 좋아함',
  ];

  const drinkingOptions = [
    '자주 마셔도 괜찮음',
    '가끔 마시는 정도면 좋음',
    '거의 안 마셨으면 좋겠음',
    '전혀 안 마시는 사람이면 좋겠음',
    '상관없음',
  ];

  const smokingOptions = [
    '흡연자도 괜찮음',
    '비흡연자였으면 좋겠음',
    '반드시 비흡연자였으면 좋겠음',
    '상관없음',
  ];

  const tattooOptions = [
    '문신 있어도 괜찮음',
    '작은 문신 정도는 괜찮음',
    '문신이 없는 사람이었으면 좋겠음',
    '상관없음',
  ];

  const interestOptions = [
    '영화', '음악', '독서', '게임', '운동', 
    '요리', '여행', '사진', '패션', '카페',
    '공연', '전시', '반려동물', '등산', '자전거'
  ];

  const mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  const ageTypeOptions = [
    { value: 'older', label: '연상' },
    { value: 'younger', label: '연하' },
    { value: 'same', label: '동갑' },
    { value: 'any', label: '상관없음' }
  ] as const;

  const validateForm = (): boolean => {
    const newErrors = {
      heightMin: !formData.heightRange.min || formData.heightRange.min < 140 || formData.heightRange.min > 200,
      heightMax: !formData.heightRange.max || formData.heightRange.max < 140 || formData.heightRange.max > 200,
      personalities: formData.personalities.length === 0,
      datingStyles: formData.datingStyles.length === 0,
      lifestyles: formData.lifestyles.length === 0,
      interests: formData.interests.length === 0,
      drinking: !formData.drinking,
      smoking: !formData.smoking,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      setShowModal(true);
    }
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // 세션 확인 및 새로고침
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('세션 확인 오류:', sessionError);
        showTemporaryModal('로그인이 만료되었습니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      if (!session) {
        // 세션이 없으면 새로고침 시도
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('세션 새로고침 오류:', refreshError);
          showTemporaryModal('로그인이 만료되었습니다. 다시 로그인해주세요.');
          router.push('/login');
          return;
        }
      }

      const userId = session?.user.id;
      console.log('현재 사용자 ID:', userId);

      // 이상형 정보 데이터 준비
      const preferenceData = {
        user_id: userId,
        preferred_age_type: formData.ageType,
        preferred_height_min: formData.heightRange.min,
        preferred_height_max: formData.heightRange.max,
        preferred_personalities: formData.personalities,
        preferred_dating_styles: formData.datingStyles,
        preferred_lifestyles: formData.lifestyles,
        preferred_interests: formData.interests,
        preferred_drinking: formData.drinking,
        preferred_smoking: formData.smoking,
        preferred_tattoo: formData.tattoo,
        preferred_mbti: formData.likedMbti,
        disliked_mbti: formData.dislikedMbti,
        updated_at: new Date().toISOString()
      };

      // upsert를 사용하여 새로운 데이터 삽입 또는 기존 데이터 업데이트
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(preferenceData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('이상형 정보 저장 오류:', upsertError);
        throw upsertError;
      }

      // localStorage에 이상형 설정 완료 상태 저장
      localStorage.setItem('hasSetIdealType', 'true');
      localStorage.setItem('idealType', JSON.stringify(formData));

      showTemporaryModal('이상형 정보가 성공적으로 저장되었습니다!');
      
      // 성공 후 홈으로 이동
      setTimeout(() => {
        router.push('/home');
      }, 2000);

    } catch (error) {
      console.error('이상형 정보 저장 중 오류 발생:', error);
      showTemporaryModal('이상형 정보 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const toggleSelection = (field: keyof IdealTypeForm, value: string, maxCount: number) => {
    if (Array.isArray(formData[field])) {
      const currentValues = formData[field] as string[];
      if (currentValues.includes(value)) {
        setFormData({
          ...formData,
          [field]: currentValues.filter(v => v !== value)
        });
      } else if (currentValues.length < maxCount) {
        setFormData({
          ...formData,
          [field]: [...currentValues, value]
        });
      }
    }
  };

  const handleSingleSelect = (field: keyof IdealTypeForm, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleMatchmaking = async () => {
    try {
      const { data: authUser, error: userError } = await supabase.auth.getUser();
      
      if (!authUser?.user?.id) {
        console.error('사용자 인증 에러');
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      const { data: candidates, error: candidatesError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError || candidatesError || !userProfile) {
        console.error('프로필 로드 에러:', profileError || candidatesError);
        return;
      }

      const { data: matchCache, error: matchCacheError } = await supabase
        .from('match_cache')
        .select('*')
        .eq('user_id', authUser.user.id);

      if (matchCacheError) {
        console.error('매칭 캐시 로드 에러:', matchCacheError);
        return;
      }

      if (!matchCache) {
        const { data: userPreferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', authUser.user.id)
          .single();

        const { data: candidatePreferences } = await supabase
          .from('user_preferences')
          .select('*');

        if (userPreferences && candidatePreferences) {
          const match = findBestMatch(userProfile, userPreferences, candidates, candidatePreferences);
          await supabase.from('match_cache').insert({ user_id: authUser.user.id, match });
        }
      }

      console.log('매칭 결과:', matchCache);

      fetch('https://your-supabase-url/functions/v1/matchmaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: authUser.user.id })
      })
      .then(response => response.json())
      .then(data => {
        console.log('매칭 결과:', data);
      })
      .catch(error => {
        console.error('매칭 오류:', error);
      });
    } catch (error) {
      console.error('매칭 오류:', error);
    }
  };

  const showTemporaryModal = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center text-gray-900">이상형 설정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 나이 선호도 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">1. 이상형의 나이</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  선호하는 나이 유형
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ageTypeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, ageType: option.value })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${formData.ageType === option.value
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 키 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.heightMin || errors.heightMax ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">2. 이상형의 키</h2>
              {errors.heightMin && (
                <span className="text-sm text-red-500">최소 키는 140cm 이상이어야 합니다</span>
              )}
              {errors.heightMax && (
                <span className="text-sm text-red-500">최대 키는 200cm 이하여야 합니다</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {heightOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, heightRange: { min: 140, max: 200 } })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.heightRange.min === 140 && formData.heightRange.max === 200
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 성격 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.personalities ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">3. 이상형의 성격 (최대 3개)</h2>
              {errors.personalities && (
                <span className="text-sm text-red-500">1개 이상 선택해주세요</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {personalityOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('personalities', option, 3)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.personalities.includes(option)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : formData.personalities.length >= 3 && !formData.personalities.includes(option)
                      ? 'bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  disabled={formData.personalities.length >= 3 && !formData.personalities.includes(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 연애 스타일 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.datingStyles ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">4. 이상형의 연애 스타일 (최대 2개)</h2>
              {errors.datingStyles && (
                <span className="text-sm text-red-500">1개 이상 선택해주세요</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {datingStyleOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('datingStyles', option, 2)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.datingStyles.includes(option)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : formData.datingStyles.length >= 2 && !formData.datingStyles.includes(option)
                      ? 'bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  disabled={formData.datingStyles.length >= 2 && !formData.datingStyles.includes(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 라이프스타일 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.lifestyles ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">5. 이상형의 라이프스타일 (최대 3개)</h2>
              {errors.lifestyles && (
                <span className="text-sm text-red-500">1개 이상 선택해주세요</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {lifestyleOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('lifestyles', option, 3)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.lifestyles.includes(option)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : formData.lifestyles.length >= 3 && !formData.lifestyles.includes(option)
                      ? 'bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  disabled={formData.lifestyles.length >= 3 && !formData.lifestyles.includes(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 관심사 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.interests ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">6. 이상형의 관심사 (최대 5개)</h2>
              {errors.interests && (
                <span className="text-sm text-red-500">1개 이상 선택해주세요</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {interestOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('interests', option, 5)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.interests.includes(option)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : formData.interests.length >= 5 && !formData.interests.includes(option)
                      ? 'bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  disabled={formData.interests.length >= 5 && !formData.interests.includes(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 음주 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.drinking ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">음주</h2>
              {errors.drinking && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {drinkingOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, drinking: option })}
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

          {/* 흡연 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.smoking ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">흡연</h2>
              {errors.smoking && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {smokingOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, smoking: option })}
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

          {/* 문신 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">문신</h2>
            <div className="grid grid-cols-2 gap-2">
              {tattooOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, tattoo: option })}
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

          {/* 좋아하는 MBTI */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">좋아하는 MBTI</h2>
            <div className="grid grid-cols-4 gap-2">
              {mbtiOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('likedMbti', option)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.likedMbti === option
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 싫어하는 MBTI */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">싫어하는 MBTI</h2>
            <div className="grid grid-cols-4 gap-2">
              {mbtiOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('dislikedMbti', option)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.dislikedMbti === option
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
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-sm hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            저장하기
          </button>
        </form>
      </div>

      {/* 에러 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalMessage || '필수 입력 항목을 확인해주세요'}
            </h3>
            <div className="space-y-2 mb-6">
              {errors.heightMin && (
                <p className="text-red-500">• 키 범위의 최소값을 입력해주세요 (140cm~200cm)</p>
              )}
              {errors.heightMax && (
                <p className="text-red-500">• 키 범위의 최대값을 입력해주세요 (140cm~200cm)</p>
              )}
              {errors.personalities && (
                <p className="text-red-500">• 성격을 1개 이상 선택해주세요</p>
              )}
              {errors.datingStyles && (
                <p className="text-red-500">• 연애 스타일을 1개 이상 선택해주세요</p>
              )}
              {errors.lifestyles && (
                <p className="text-red-500">• 라이프스타일을 1개 이상 선택해주세요</p>
              )}
              {errors.interests && (
                <p className="text-red-500">• 관심사를 1개 이상 선택해주세요</p>
              )}
              {errors.drinking && (
                <p className="text-red-500">• 음주 여부를 선택해주세요</p>
              )}
              {errors.smoking && (
                <p className="text-red-500">• 흡연 여부를 선택해주세요</p>
              )}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 