'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  height: string;
  personalities: string[];
  datingStyles: string[];
  lifestyles: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
}

const heightOptions = ['150cm 이하', '151-160cm', '161-170cm', '171-180cm', '181cm 이상'];
const personalityOptions = ['활발한', '차분한', '다정한', '유머러스한', '지적인', '열정적인'];
const datingStyleOptions = ['적극적인', '로맨틱한', '자상한', '독립적인', '계획적인'];
const lifestyleOptions = ['운동', '여행', '문화생활', '맛집탐방', '집순이/집돌이', '게임'];
const drinkingOptions = ['전혀 안 함', '가끔', '자주'];
const smokingOptions = ['비흡연', '흡연'];
const tattooOptions = ['없음', '있음', '상관없음'];

const IdealTypeSettings = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    height: '',
    personalities: [],
    datingStyles: [],
    lifestyles: [],
    drinking: '',
    smoking: '',
    tattoo: '',
  });

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
      // Save to localStorage
      localStorage.setItem('idealType', JSON.stringify(formData));
      router.push('/home');
    } catch (error) {
      console.error('Failed to save ideal type:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Height */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">키</label>
          <div className="flex flex-wrap gap-2">
            {heightOptions.map((option) => (
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

        {/* Personalities */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">성격 (최대 3개)</label>
          <div className="flex flex-wrap gap-2">
            {personalityOptions.map((option) => (
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
        </div>

        {/* Dating Styles */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">연애 스타일 (최대 2개)</label>
          <div className="flex flex-wrap gap-2">
            {datingStyleOptions.map((option) => (
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

        {/* Lifestyles */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">라이프스타일 (최대 3개)</label>
          <div className="flex flex-wrap gap-2">
            {lifestyleOptions.map((option) => (
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

        {/* Drinking */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">음주</label>
          <div className="flex flex-wrap gap-2">
            {drinkingOptions.map((option) => (
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

        {/* Smoking */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">흡연</label>
          <div className="flex flex-wrap gap-2">
            {smokingOptions.map((option) => (
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

        {/* Tattoo */}
        <div className="space-y-4">
          <label className="block text-lg font-medium">타투</label>
          <div className="flex flex-wrap gap-2">
            {tattooOptions.map((option) => (
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

        <button type="submit" className="btn-primary w-full">
          저장하기
        </button>
      </form>
    </div>
  );
};

export default IdealTypeSettings; 