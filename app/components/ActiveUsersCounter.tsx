'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosServer from '@/utils/axios';

export default function ActiveUsersCounter() {
  const [actualCount, setActualCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0); // 실제 사용자 수 + 100
  const [prevCount, setPrevCount] = useState(0);
  const [floatingNumbers, setFloatingNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // 초기 로드 시 사용자 수 가져오기
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await axiosServer.get('/matching/total-count');
      setActualCount(response.data.count);
      setDisplayCount(response.data.count + 100);
      setPrevCount(response.data.count + 100);
      setShowAnimation(false);
      setTimeout(() => {
        setFloatingNumbers(Math.floor(Math.random() * 100));
        setShowAnimation(true);
      }, 100);
    } catch (error) {
      console.error('사용자 수 조회 중 오류 발생:', error);
    }
  };

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
              {displayCount ? displayCount.toLocaleString() : '로딩중...'}
            </span>명이
          </h2>
          <p className="text-3xl font-bold text-gray-600">신청했어요!</p>
        </div>

        {/* 증가하는 숫자 애니메이션 */}
        <AnimatePresence>
          {showAnimation && floatingNumbers && (
            <motion.div
              key="floating-number"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1.2 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              transition={{ duration: 1 }}
              className="floating-number"
            >
              +{floatingNumbers}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}