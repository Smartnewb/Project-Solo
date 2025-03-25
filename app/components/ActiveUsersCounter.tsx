'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

export default function ActiveUsersCounter() {
  const [actualCount, setActualCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0); // 실제 사용자 수 + 100
  const [prevCount, setPrevCount] = useState(0);
  const [floatingNumbers, setFloatingNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserCount = async () => {
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('사용자 수 조회 오류:', error);
        return;
      }

      // 실제 사용자 수 설정
      const actualUserCount = count || 0;
      setActualCount(actualUserCount);
      
      // 표시용 사용자 수 (실제 + 100)
      setDisplayCount(actualUserCount + 100);
      setPrevCount(actualUserCount + 100);
      
      setIsLoading(false);
    } catch (error) {
      console.error('사용자 수 조회 중 오류 발생:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드 시 사용자 수 가져오기
    fetchUserCount();

    // 주기적으로 사용자 수 업데이트 (옵션)
    const interval = setInterval(() => {
      fetchUserCount();
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && displayCount !== prevCount) {
      setFloatingNumbers(prev => [...prev, displayCount - prevCount]);
      setPrevCount(displayCount);

      setTimeout(() => {
        setFloatingNumbers(prev => prev.slice(1));
      }, 1000);
    }
  }, [displayCount, prevCount, isLoading]);

  return (
    <div className="text-center py-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="registration-count"
      >
        <div className="count-main space-y-2">
          <h2 className="text-4xl font-black mb-2 whitespace-nowrap">
            지금까지{' '}
            <span className="highlight-text number-pulse">
              {isLoading ? '로딩 중...' : displayCount.toLocaleString()}
            </span>명이
          </h2>
          <p className="text-3xl font-bold text-gray-600">신청했어요!</p>
        </div>
        
        {/* 증가하는 숫자 애니메이션 */}
        <AnimatePresence>
          {floatingNumbers.map((num, index) => (
            <motion.div
              key={`${index}-${num}`}
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1.2 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              transition={{ duration: 1 }}
              className="floating-number"
            >
              +{num}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 