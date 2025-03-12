'use client';

import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function MatchingCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // 다음 매칭 시간을 오늘 저녁 8시로 설정
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(20, 0, 0, 0);

      // 이미 8시가 지났다면 다음 날로 설정
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const difference = target.getTime() - now.getTime();
      
      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // 초기 시간 설정
    setTimeLeft(calculateTimeLeft());

    // 1초마다 업데이트
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-h2 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 text-primary-DEFAULT" />
        매칭 시작까지
      </h2>
      <div className="flex justify-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-DEFAULT">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-500">시간</div>
        </div>
        <div className="text-3xl font-bold text-primary-DEFAULT">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-DEFAULT">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-500">분</div>
        </div>
        <div className="text-3xl font-bold text-primary-DEFAULT">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-DEFAULT">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-500">초</div>
        </div>
      </div>
    </div>
  );
} 