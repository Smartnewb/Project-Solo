'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface FormData {
  preferred_height_min: number;
  preferred_height_max: number;
  preferred_personalities: string[];
  preferred_dating_styles: string[];
  preferred_lifestyles: string[];
  preferred_interests: string[];
  preferred_drinking: string[];
  preferred_smoking: string[];
  preferred_tattoo: string[];
  preferred_mbti: string[];
  disliked_mbti: string[];
  preferred_age_type: string[];
}

const heightOptions = [
  { label: '150cm 이하', min: 0, max: 150 },
  { label: '151-160cm', min: 151, max: 160 },
  { label: '161-170cm', min: 161, max: 170 },
  { label: '171-180cm', min: 171, max: 180 },
  { label: '181cm 이상', min: 181, max: 999 }
];
const personalityOptions = ['활발한', '차분한', '다정한', '유머러스한', '지적인', '열정적인'];
const datingStyleOptions = ['적극적인', '로맨틱한', '자상한', '독립적인', '계획적인'];
const lifestyleOptions = ['운동', '여행', '문화생활', '맛집탐방', '집순이/집돌이', '게임'];
const drinkingOptions = ['전혀 안 함', '가끔', '자주'];
const smokingOptions = ['비흡연', '흡연'];
const tattooOptions = ['없음', '있음', '상관없음'];

// 간단한 로더 컴포넌트
const Loader = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

const IdealTypeSettings = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    preferred_height_min: 0,
    preferred_height_max: 0,
    preferred_personalities: [],
    preferred_dating_styles: [],
    preferred_lifestyles: [],
    preferred_interests: [],
    preferred_drinking: [],
    preferred_smoking: [],
    preferred_tattoo: [],
    preferred_mbti: [],
    disliked_mbti: [],
    preferred_age_type: []
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 사용자 선호도 데이터 로드
  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        
        // 현재 로그인된 사용자의 ID 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('사용자 인증 정보가 없습니다.');
          router.push('/login');
          return;
        }

        console.log('=== 현재 로그인한 사용자 정보 ===');
        console.log(user);
        
        // 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('프로필 정보 조회 오류:', profileError);
        } else {
          console.log('=== 프로필 정보 ===');
          console.log(profileData);
        }
        
        // 사용자 선호도 정보 가져오기
        const { data: preferenceData, error: preferenceError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (preferenceError && preferenceError.code !== 'PGRST116') {
          console.error('사용자 선호도 정보 조회 오류:', preferenceError);
        } else if (preferenceData) {
          console.log('=== 현재 저장된 선호도 정보 ===');
          console.log(preferenceData);

          // 데이터가 있으면 폼 상태 업데이트
          setFormData({
            preferred_height_min: preferenceData.preferred_height_min || 0,
            preferred_height_max: preferenceData.preferred_height_max || 0,
            preferred_personalities: preferenceData.preferred_personalities || [],
            preferred_dating_styles: preferenceData.preferred_dating_styles || [],
            preferred_lifestyles: preferenceData.preferred_lifestyles || [],
            preferred_interests: preferenceData.preferred_interests || [],
            preferred_drinking: preferenceData.preferred_drinking || [],
            preferred_smoking: preferenceData.preferred_smoking || [],
            preferred_tattoo: preferenceData.preferred_tattoo || [],
            preferred_mbti: preferenceData.preferred_mbti || [],
            disliked_mbti: preferenceData.disliked_mbti || [],
            preferred_age_type: preferenceData.preferred_age_type || []
          });

          console.log('=== 현재 폼 데이터 상태 ===');
          console.log(formData);
        }
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPreferences();
  }, [supabase, router]);

  const toggleSelection = (field: keyof FormData, value: string, maxCount: number) => {
    if (!Array.isArray(formData[field])) return;
    
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : currentValues.length < maxCount
        ? [...currentValues, value]
        : currentValues;

    setFormData({ ...formData, [field]: newValues });
  };

  const handleHeightRangeSelect = (min: number, max: number) => {
    setFormData({
      ...formData,
      preferred_height_min: min,
      preferred_height_max: max
    });
  };

  const handleSingleOptionSelect = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: [value]
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log('=== 저장 시도 중인 데이터 ===');
      console.log(formData);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('사용자 인증 정보가 없습니다.');
        return;
      }

      // 빈 배열을 null로 변환하여 저장
      const dataToSave = {
        user_id: user.id,
        preferred_height_min: formData.preferred_height_min,
        preferred_height_max: formData.preferred_height_max,
        preferred_personalities: formData.preferred_personalities.length > 0 ? formData.preferred_personalities : null,
        preferred_dating_styles: formData.preferred_dating_styles.length > 0 ? formData.preferred_dating_styles : null,
        preferred_lifestyles: formData.preferred_lifestyles.length > 0 ? formData.preferred_lifestyles : null,
        preferred_interests: formData.preferred_interests.length > 0 ? formData.preferred_interests : null,
        preferred_drinking: formData.preferred_drinking.length > 0 ? formData.preferred_drinking : null,
        preferred_smoking: formData.preferred_smoking.length > 0 ? formData.preferred_smoking : null,
        preferred_tattoo: formData.preferred_tattoo.length > 0 ? formData.preferred_tattoo : null,
        preferred_mbti: formData.preferred_mbti.length > 0 ? formData.preferred_mbti : null,
        disliked_mbti: formData.disliked_mbti.length > 0 ? formData.disliked_mbti : null,
        preferred_age_type: formData.preferred_age_type.length > 0 ? formData.preferred_age_type : null,
        updated_at: new Date()
      };

      console.log('=== DB에 저장될 데이터 ===');
      console.log(dataToSave);

      const { error } = await supabase
        .from('user_preferences')
        .upsert(dataToSave);

      if (error) {
        console.error('저장 중 오류 발생:', error);
        throw error;
      }

      console.log('=== 저장 성공 ===');
      alert('이상형 설정이 저장되었습니다.');
      router.push('/settings');
    } catch (error) {
      console.error('이상형 저장 실패:', error);
      alert('이상형 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        되돌아가기
      </button>
      
      <h1 className="text-2xl font-bold mb-6">이상형 설정</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Height */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">키</label>
          <div className="flex flex-wrap gap-2">
            {heightOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleHeightRangeSelect(option.min, option.max)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_height_min === option.min && 
                  formData.preferred_height_max === option.max
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Personalities */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">성격 (최대 3개)</label>
          <div className="flex flex-wrap gap-2">
            {personalityOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleSelection('preferred_personalities', option, 3)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_personalities.includes(option) 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Dating Styles */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">연애 스타일 (최대 2개)</label>
          <div className="flex flex-wrap gap-2">
            {datingStyleOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleSelection('preferred_dating_styles', option, 2)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_dating_styles.includes(option) 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Lifestyles */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">라이프스타일 (최대 3개)</label>
          <div className="flex flex-wrap gap-2">
            {lifestyleOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleSelection('preferred_lifestyles', option, 3)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_lifestyles.includes(option) 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Drinking */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">음주</label>
          <div className="flex flex-wrap gap-2">
            {drinkingOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSingleOptionSelect('preferred_drinking', option)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_drinking.includes(option)
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Smoking */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">흡연</label>
          <div className="flex flex-wrap gap-2">
            {smokingOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSingleOptionSelect('preferred_smoking', option)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_smoking.includes(option)
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Tattoo */}
        <div className="card p-6 bg-white rounded-xl shadow-md space-y-4">
          <label className="block text-lg font-medium">타투</label>
          <div className="flex flex-wrap gap-2">
            {tattooOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSingleOptionSelect('preferred_tattoo', option)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.preferred_tattoo.includes(option)
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            type="button" 
            onClick={() => router.push('/settings')}
            className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-medium"
          >
            취소
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium flex justify-center items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              '저장하기'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IdealTypeSettings; 