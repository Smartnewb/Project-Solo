'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface MatchingCountdownProps {
  onTimeOver: (isOver: boolean) => void;
}

export default function MatchingCountdown({ onTimeOver }: MatchingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // 초기 상태를 로컬 스토리지에서 가져오도록 수정
  const [matchingTime, setMatchingTime] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedTime = localStorage.getItem('matchingTime');
      if (savedTime) {
        const savedDate = new Date(savedTime);
        const now = new Date();
        if (savedDate > now) {
          return savedTime;
        } else {
          localStorage.removeItem('matchingTime');
        }
      }
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // 매칭 시간 가져오기 함수를 useCallback으로 메모이제이션
  const fetchMatchingTime = useCallback(async () => {
    try {
      console.log('매칭 시간 조회 시작');
      const response = await fetch('/api/admin/matching-time');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('매칭 시간 API 응답:', data);
      
      // matchingDateTime 또는 matchingTime 필드 검사
      const serverTimeString = data.matchingDateTime || data.matchingTime;
      
      if (serverTimeString) {
        console.log('서버에서 받은 시간:', serverTimeString);
        const serverTime = new Date(serverTimeString);
        const now = new Date();
        const currentMatchingTime = matchingTime ? new Date(matchingTime) : null;
        
        console.log(`서버 시간: ${serverTime}, 현재 시간: ${now}`);
        
        // 서버 시간이 현재 시간보다 이후이고,
        // 현재 설정된 매칭 시간이 없거나 서버 시간이 더 미래인 경우에만 업데이트
        if (serverTime > now && (!currentMatchingTime || serverTime > currentMatchingTime)) {
          console.log('매칭 시간 업데이트:', serverTimeString);
          localStorage.setItem('matchingTime', serverTimeString);
          setMatchingTime(serverTimeString);
        } else {
          console.log('매칭 시간 업데이트 안함 - 이미 지나거나 기존 시간보다 이전');
        }
      } else {
        console.log('서버에서 매칭 시간을 받지 못함');
      }
    } catch (error) {
      console.error('매칭 시간 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matchingTime]);

  // 컴포넌트 마운트 시 한 번만 서버에서 시간을 가져옴
  useEffect(() => {
    if (!matchingTime) {
      fetchMatchingTime();
    } else {
      setIsLoading(false);
    }
  }, [fetchMatchingTime, matchingTime]);

  useEffect(() => {
    if (!matchingTime) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(matchingTime);

      if (now > target) {
        localStorage.removeItem('matchingTime');
        setMatchingTime(null);
        fetchMatchingTime();
        onTimeOver(true);
        return {
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }

      onTimeOver(false);
      const difference = target.getTime() - now.getTime();
      
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [matchingTime, fetchMatchingTime, onTimeOver]);

  if (isLoading && !matchingTime) {
    return (
      <div className="space-y-3">
        <h2 className="text-h2 flex items-center gap-2">
          <ClockIcon className="w-6 h-6 text-primary-DEFAULT" />
          매칭 시간 로딩 중...
        </h2>
      </div>
    );
  }

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
        <>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-DEFAULT">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">시간</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-DEFAULT">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">분</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-DEFAULT">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">초</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            매칭 시작: {new Date(matchingTime).toLocaleString('ko-KR')}
          </p>
        </>
      )}
    </div>
  );
}