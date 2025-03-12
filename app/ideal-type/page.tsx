'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface IdealTypeForm {
  height: string;
  personalities: string[];
  personalityNote: string;
  datingStyles: string[];
  datingStyleNote: string;
  lifestyles: string[];
  lifestyleNote: string;
  drinking: string;
  smoking: string;
  tattoo: string;
  interests: string[];
}

export default function IdealType() {
  const router = useRouter();
  const [formData, setFormData] = useState<IdealTypeForm>({
    height: '',
    personalities: [],
    personalityNote: '',
    datingStyles: [],
    datingStyleNote: '',
    lifestyles: [],
    lifestyleNote: '',
    drinking: '',
    smoking: '',
    tattoo: '',
    interests: [],
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 이상형 정보를 localStorage에 저장
      localStorage.setItem('idealType', JSON.stringify(formData));
      router.push('/home');
    } catch (error) {
      console.error('이상형 저장 에러:', error);
      alert('이상형 정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600"
          >
            ← 뒤로
          </button>
          <h1 className="text-h2 flex-1 text-center">이상형 설정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 키 */}
          <div className="card space-y-4">
            <h2 className="text-h2">1. 이상형의 키</h2>
            <div className="grid grid-cols-2 gap-2">
              {heightOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, height: option })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.height === option
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 성격 */}
          <div className="card space-y-4">
            <h2 className="text-h2">2. 이상형의 성격 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {personalityOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('personalities', option, 3)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.personalities.includes(option)
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 연애 스타일 */}
          <div className="card space-y-4">
            <h2 className="text-h2">3. 이상형의 연애 스타일 (최대 2개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {datingStyleOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('datingStyles', option, 2)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.datingStyles.includes(option)
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 라이프스타일 */}
          <div className="card space-y-4">
            <h2 className="text-h2">4. 이상형의 라이프스타일 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {lifestyleOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('lifestyles', option, 3)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.lifestyles.includes(option)
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 관심사 */}
          <div className="card space-y-4">
            <h2 className="text-h2">5. 이상형의 관심사 (최대 5개)</h2>
            <div className="grid grid-cols-3 gap-2">
              {interestOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('interests', option, 5)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.interests.includes(option)
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : formData.interests.length >= 5 && !formData.interests.includes(option)
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                  disabled={formData.interests.length >= 5 && !formData.interests.includes(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 음주 */}
          <div className="card space-y-4">
            <h2 className="text-h2">음주</h2>
            <div className="grid grid-cols-2 gap-2">
              {drinkingOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, drinking: option })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.drinking === option
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 흡연 */}
          <div className="card space-y-4">
            <h2 className="text-h2">흡연</h2>
            <div className="grid grid-cols-2 gap-2">
              {smokingOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, smoking: option })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.smoking === option
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 문신 */}
          <div className="card space-y-4">
            <h2 className="text-h2">문신</h2>
            <div className="grid grid-cols-2 gap-2">
              {tattooOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, tattoo: option })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors
                    ${formData.tattoo === option
                      ? 'bg-white text-gray-700 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#4A90E2]'
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
            className="btn-primary w-full"
          >
            저장하기
          </button>
        </form>
      </div>
    </div>
  );
} 