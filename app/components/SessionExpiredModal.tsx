'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: 'timeout' | 'session_expired';
}

export default function SessionExpiredModal({ isOpen, onClose, error = 'session_expired' }: SessionExpiredModalProps) {
  const router = useRouter();
  const { logout } = useAdminAuth();

  const messages = {
    timeout: '로그인 시간이 초과되었습니다.',
    session_expired: '세션이 만료되었습니다.'
  };

  const handleLogout = async () => {
    try {
      await logout(); // AdminAuthContext의 logout 함수 사용
      onClose();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      // 에러가 발생해도 홈으로 이동
      router.push('/');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2">로그인이 필요합니다</h3>
              <p className="text-gray-600 mb-4">
                {messages[error]}
              </p>
              <p className="text-sm text-gray-500">
                다시 로그인해주세요.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                로그인하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}