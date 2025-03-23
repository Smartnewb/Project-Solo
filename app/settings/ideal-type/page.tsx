'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface FormData {
  height: string;
  personalities: string[];
  dating_styles: string[];
  ideal_lifestyles: string[];
  drinking_preference: string;
  smoking_preference: string;
  tattoo: string;
}

const heightOptions = ['150cm 이하', '151-160cm', '161-170cm', '171-180cm', '181cm 이상'];
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
    height: '',
    personalities: [],
    dating_styles: [],
    ideal_lifestyles: [],
    drinking_preference: '',
    smoking_preference: '',
    tattoo: '',
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
        
        // 사용자 선호도 정보 가져오기
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('사용자 선호도 정보 조회 오류:', error);
        } else if (data) {
          // 데이터가 있으면 폼 상태 업데이트
          setFormData({
            height: data.height || '',
            personalities: data.personalities || [],
            dating_styles: data.dating_styles || [],
            ideal_lifestyles: data.ideal_lifestyles || [],
            drinking_preference: data.drinking_preference || '',
            smoking_preference: data.smoking_preference || '',
            tattoo: data.tattoo || '',
          });
        }
      } catch (error) {
        console.error('선호도 데이터 로딩 중 오류 발생:', error);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // 현재 로그인된 사용자의 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('사용자 인증 정보가 없습니다.');
        return;
      }
      
      // Supabase에 저장
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          height: formData.height,
          personalities: formData.personalities,
          dating_styles: formData.dating_styles,
          ideal_lifestyles: formData.ideal_lifestyles,
          drinking_preference: formData.drinking_preference,
          smoking_preference: formData.smoking_preference,
          tattoo: formData.tattoo,
          updated_at: new Date(),
        });
        
      if (error) {
        throw error;
      }
      
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
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, height: option })}
                className={`px-4 py-2 rounded-lg border ${
                  formData.height === option 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option}
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
                onClick={() => toggleSelection('personalities', option, 3)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.personalities.includes(option) 
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
                onClick={() => toggleSelection('dating_styles', option, 2)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.dating_styles.includes(option) 
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
                onClick={() => toggleSelection('ideal_lifestyles', option, 3)}
                className={`px-4 py-2 rounded-lg border ${
                  formData.ideal_lifestyles.includes(option) 
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
                onClick={() => setFormData({ ...formData, drinking_preference: option })}
                className={`px-4 py-2 rounded-lg border ${
                  formData.drinking_preference === option 
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
                onClick={() => setFormData({ ...formData, smoking_preference: option })}
                className={`px-4 py-2 rounded-lg border ${
                  formData.smoking_preference === option 
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
                onClick={() => setFormData({ ...formData, tattoo: option })}
                className={`px-4 py-2 rounded-lg border ${
                  formData.tattoo === option 
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