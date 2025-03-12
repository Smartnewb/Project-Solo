'use client';

import { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface DateSpot {
  emoji: string;
  name: string;
  matchRate: number;
}

const dateSpots: DateSpot[] = [
  { emoji: '🎬', name: '영화관', matchRate: 90 },
  { emoji: '☕', name: '감성적인 카페', matchRate: 85 },
  { emoji: '🎢', name: '놀이공원', matchRate: 80 },
  { emoji: '🍽', name: '맛집 탐방', matchRate: 88 },
  { emoji: '📚', name: '북카페', matchRate: 82 },
  { emoji: '🎨', name: '전시회', matchRate: 87 },
  { emoji: '🌳', name: '공원 산책', matchRate: 83 },
  { emoji: '🎮', name: '게임센터', matchRate: 78 }
];

export default function DateSpotRecommendation() {
  const [recommendations, setRecommendations] = useState<DateSpot[]>([]);

  useEffect(() => {
    // 랜덤하게 3개의 데이트 장소 선택
    const shuffled = [...dateSpots].sort(() => 0.5 - Math.random());
    setRecommendations(shuffled.slice(0, 3));
  }, []);

  return (
    <div className="card bg-white p-4 space-y-4">
      <h2 className="text-h2 flex items-center gap-2">
        <MapPinIcon className="w-5 h-5 text-primary-DEFAULT" />
        오늘의 추천 데이트 장소
      </h2>
      <div className="space-y-3">
        {recommendations.map((spot, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{spot.emoji}</span>
              <span className="text-gray-700">{spot.name}</span>
            </div>
            <span className="text-primary-DEFAULT font-medium">
              {spot.matchRate}% 추천
            </span>
          </div>
        ))}
      </div>
      <button className="w-full py-2 text-primary-DEFAULT text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors">
        더보기
      </button>
    </div>
  );
} 