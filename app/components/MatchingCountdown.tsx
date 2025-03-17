'use client';

import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function MatchingCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [matchingTime, setMatchingTime] = useState<string | null>(null);

  useEffect(() => {
    // 매칭 시간 가져오기
    const fetchMatchingTime = async () => {
      try {
        const response = await fetch('/api/admin/matching-time');
        const data = await response.json();
        setMatchingTime(data.matchingDateTime);
      } catch (error) {
        console.error('매칭 시간 조회 실패:', error);
      }
    };

    fetchMatchingTime();
  }, []);

  useEffect(() => {
    if (!matchingTime) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(matchingTime);

      // 이미 매칭 시간이 지났다면 다음 매칭 시간으로 설정
      if (now > target) {
        return {
          hours: 0,
          minutes: 0,
          seconds: 0
        };
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
  }, [matchingTime]);

  if (!matchingTime) {
    return (
      <div className="space-y-3">
        <h2 className="text-h2 flex items-center gap-2">
          <ClockIcon className="w-6 h-6 text-primary-DEFAULT" />
          매칭 시간 설정 대기 중
        </h2>
        <p className="text-gray-600">아직 매칭 시간이 설정되지 않았습니다.</p>
      </div>
    );
  }

  const isMatchingTimeOver = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="space-y-3">
      <h2 className="text-h2 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 text-primary-DEFAULT" />
        {isMatchingTimeOver ? '매칭 시간 종료' : '매칭 시작까지'}
      </h2>
      {isMatchingTimeOver ? (
        <p className="text-gray-600">다음 매칭 시간을 기다려주세요.</p>
      ) : (
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
      )}
      <p className="text-sm text-gray-500 text-center">
        매칭 시작: {new Date(matchingTime).toLocaleString('ko-KR')}
      </p>
    </div>
  );
} 