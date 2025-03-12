'use client';

import { useState, useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const tips = [
  "첫 만남에서는 너무 긴장하지 말고 자연스럽게 웃어주세요!",
  "상대방의 이야기에 귀 기울이고 적절한 리액션을 해주세요.",
  "첫 만남에서는 가벼운 주제로 대화를 시작하는 것이 좋아요.",
  "상대방의 취미나 관심사에 대해 물어보세요.",
  "시간 약속은 꼭 지켜주세요!",
  "단정하고 깔끔한 옷차림을 준비하세요.",
  "상대방을 존중하는 태도를 보여주세요.",
  "너무 과한 농담은 피하는 것이 좋아요.",
  "카페나 레스토랑은 미리 예약하면 좋아요.",
  "첫 만남에서 과한 스킨십은 피하세요."
];

export default function DatingTip() {
  const [todayTip, setTodayTip] = useState('');

  useEffect(() => {
    // 오늘의 날짜를 기준으로 팁을 선택
    const today = new Date().getDate();
    const tipIndex = today % tips.length;
    setTodayTip(tips[tipIndex]);
  }, []);

  return (
    <div className="card bg-white p-4 space-y-3">
      <h2 className="text-h2 flex items-center gap-2">
        <span className="text-xl">💡</span>
        오늘의 소개팅 꿀팁
      </h2>
      <p className="text-gray-700">{todayTip}</p>
      <button className="flex items-center text-primary-DEFAULT text-sm font-medium hover:text-primary-dark transition-colors">
        더 많은 팁 보기
        <ChevronRightIcon className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
} 