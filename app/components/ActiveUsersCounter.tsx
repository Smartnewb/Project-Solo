'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActiveUsersCounter() {
  const [count, setCount] = useState(3622);
  const [prevCount, setPrevCount] = useState(count);
  const [floatingNumbers, setFloatingNumbers] = useState<number[]>([]);

  useEffect(() => {
    // 실제 구현에서는 여기서 API를 호출하여 실제 등록자 수를 가져옵니다
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (count !== prevCount) {
      setFloatingNumbers(prev => [...prev, count - prevCount]);
      setPrevCount(count);

      setTimeout(() => {
        setFloatingNumbers(prev => prev.slice(1));
      }, 1000);
    }
  }, [count, prevCount]);

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
          <h2 className="text-5xl font-black mb-2">
            지금까지{' '}
            <span className="highlight-text number-pulse">
              {count.toLocaleString()}
            </span>
            명이
          </h2>
          <p className="text-3xl font-bold text-gray-600">등록했어요!</p>
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