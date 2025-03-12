'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileForm {
  height: string;
  personalities: string[];
  personalityNote: string;
  datingStyles: string[];
  lifestyles: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
}

export default function Profile() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileForm>({
    height: '',
    personalities: [],
    personalityNote: '',
    datingStyles: [],
    lifestyles: [],
    drinking: '',
    smoking: '',
    tattoo: '',
  });

  const heightOptions = [
    '155cm 이하',
    '156~160cm',
    '161~165cm',
    '166~170cm',
    '171~175cm',
    '176cm 이상',
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
    '표현을 잘 안 하지만 속은 다정한 스타일',
    '자유로운 연애를 선호하는 스타일',
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
    '자주 마시는 편',
    '가끔 마시는 편',
    '거의 안 마시는 편',
    '전혀 마시지 않음',
  ];

  const smokingOptions = [
    '네, 흡연자입니다',
    '금연 중입니다',
    '비흡연자입니다',
  ];

  const tattooOptions = [
    '네, 있습니다',
    '작은 문신이 있습니다',
    '없습니다',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: 프로필 정보 저장 로직 구현
      localStorage.setItem('profile', JSON.stringify(formData));
      router.push('/home');
    } catch (error) {
      console.error('프로필 저장 에러:', error);
      alert('프로필 정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const toggleSelection = (field: keyof ProfileForm, value: string, maxCount: number) => {
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
          <h1 className="text-h2 flex-1 text-center">프로필 작성</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 키 */}
          <div className="card space-y-4">
            <h2 className="text-h2">1. 본인의 키</h2>
            <div className="grid grid-cols-2 gap-2">
              {heightOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, height: option })}
                  className={`btn-select ${formData.height === option ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 성격 */}
          <div className="card space-y-4">
            <h2 className="text-h2">2. 본인의 성격 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {personalityOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('personalities', option, 3)}
                  className={`btn-select ${formData.personalities.includes(option) ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <textarea
              value={formData.personalityNote}
              onChange={(e) => setFormData({ ...formData, personalityNote: e.target.value })}
              placeholder="추가 설명을 입력해주세요 (예: '처음엔 낯가리지만 친해지면 장난도 잘 쳐요!')"
              className="input-field"
              rows={2}
            />
          </div>

          {/* 연애 스타일 */}
          <div className="card space-y-4">
            <h2 className="text-h2">3. 본인의 연애 스타일 (최대 2개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {datingStyleOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('datingStyles', option, 2)}
                  className={`btn-select ${formData.datingStyles.includes(option) ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 라이프스타일 */}
          <div className="card space-y-4">
            <h2 className="text-h2">4. 라이프스타일 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {lifestyleOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleSelection('lifestyles', option, 3)}
                  className={`btn-select ${formData.lifestyles.includes(option) ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 음주 */}
          <div className="card space-y-4">
            <h2 className="text-h2">술을 즐기는 편인가요?</h2>
            <div className="grid grid-cols-2 gap-2">
              {drinkingOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, drinking: option })}
                  className={`btn-select ${formData.drinking === option ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 흡연 */}
          <div className="card space-y-4">
            <h2 className="text-h2">담배를 피우시나요?</h2>
            <div className="grid grid-cols-2 gap-2">
              {smokingOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, smoking: option })}
                  className={`btn-select ${formData.smoking === option ? 'selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 문신 */}
          <div className="card space-y-4">
            <h2 className="text-h2">문신이 있나요?</h2>
            <div className="grid grid-cols-2 gap-2">
              {tattooOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, tattoo: option })}
                  className={`btn-select ${formData.tattoo === option ? 'selected' : ''}`}
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