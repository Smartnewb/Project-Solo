'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const personalities = ['ENFP', 'INFJ', 'ENTJ', 'ISFP', 'ESFJ'];
const heights = ['160cm', '165cm', '170cm', '175cm', '180cm'];
const characteristics = [
  '배려심 많은',
  '활발한',
  '차분한',
  '지적인',
  '유머러스한',
  '낭만적인',
  '성실한',
  '창의적인'
];

export default function MatchPrediction() {
  const [prediction, setPrediction] = useState({
    mbti: '',
    height: '',
    characteristic: '',
    matchRate: 0
  });

  useEffect(() => {
    // 랜덤한 예측 생성
    const randomPrediction = {
      mbti: personalities[Math.floor(Math.random() * personalities.length)],
      height: heights[Math.floor(Math.random() * heights.length)],
      characteristic: characteristics[Math.floor(Math.random() * characteristics.length)],
      matchRate: Math.floor(Math.random() * 16) + 85 // 85~100% 사이의 랜덤 값
    };
    setPrediction(randomPrediction);
  }, []);

  return (
    <div className="card bg-white p-4 space-y-4">
      <h2 className="text-h2 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-primary-DEFAULT" />
        오늘 당신과 잘 맞을 것 같은 이상형
      </h2>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <span className="text-gray-700">
            {prediction.mbti} / {prediction.height} / {prediction.characteristic} 성격
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="text-primary-DEFAULT font-bold">
            매칭 성공 확률: {prediction.matchRate}%
          </span>
        </div>
      </div>
      <button className="w-full py-2 text-primary-DEFAULT text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors">
        더 알아보기
      </button>
    </div>
  );
} 