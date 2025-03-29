'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  HeartIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationCircleIcon, 
  XMarkIcon, 
  PencilSquareIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function TestMatchingResult() {
  const router = useRouter();
  
  // 테스트용 가상의 매칭 데이터
  const [matchingData] = useState({
    id: 'test-matching-123',
    created_at: new Date().toISOString(),
    score: 85,
    compatibility_reasons: [
      '취미가 비슷해요',
      'MBTI 궁합이 좋아요',
      '데이트 스타일이 잘 맞아요'
    ],
    matchedUser: {
      id: 'test-user-456',
      user_id: 'test-user-456',
      nickname: '민지',
      age: 23,
      gender: 'female',
      department: '컴퓨터공학과',
      mbti: 'ENFP',
      height: 165,
      personalities: ['활발한', '긍정적인', '재미있는', '사교적인'],
      dating_styles: ['대화가 많은', '활동적인', '달달한'],
      interests: ['영화 감상', '카페 탐방', '여행', '독서'],
      avatar_url: 'https://randomuser.me/api/portraits/women/65.jpg',
      instagram_id: 'minji_lovely',
      university: '서울대학교',
      grade: 3,
      drinking: '가끔 마심',
      smoking: '비흡연',
      tattoo: '없음',
      lifestyles: ['아침형 인간', '계획적인', '깔끔한']
    }
  });

  // 상태 관리
  const [liked, setLiked] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  // 계좌번호 복사용 ref
  const accountNumberRef = useRef<HTMLParagraphElement>(null);
  
  // 피드백 관련 상태
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  // 좋아요 토글 처리
  const toggleLike = () => {
    setLiked(!liked);
    if (!liked) {
      setNotificationMessage('상대방에게 관심 표시 알림을 보냈습니다.');
      setShowNotificationModal(true);
    }
  };
  
  // 계좌번호 복사 기능
  const copyAccountNumber = () => {
    navigator.clipboard.writeText("카카오뱅크 전준영 3333225272696")
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('계좌번호 복사 실패:', err);
      });
  };
  
  // 피드백 제출 함수
  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      setNotificationMessage('피드백 내용을 입력해주세요.');
      setShowNotificationModal(true);
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      // 테스트 페이지에서는 실제 데이터베이스에 저장하지 않음
      // 성공 메시지만 표시
      setTimeout(() => {
        setFeedbackText('');
        setNotificationMessage('피드백이 커뮤니티에 공유되었습니다!');
        setShowNotificationModal(true);
        setIsSubmittingFeedback(false);
      }, 1000);
      
      // 실제 구현 시에는 아래와 같이 작성됨:
      /*
      const supabase = createClient();
      
      // UUID 생성 함수
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      // 현재 시간
      const now = new Date().toISOString();
      const postId = generateUUID();
      
      // 커뮤니티에 피드백 게시물 생성 - 'posts' 테이블 사용
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: postId,
            author_id: 'test-user-id',
            content: `[매칭 피드백] ${feedbackText}`,
            nickname: '테스트 사용자',
            emoji: '😊',
            created_at: now,
            updated_at: now,
            likes: [],
            reports: [],
            isEdited: false,
            isdeleted: false,
            is_matching_feedback: true,
            matching_score: matchingData.score,
            matching_reasons: matchingData.compatibility_reasons
          }
        ]);
      
      if (error) throw error;
      */
      
    } catch (err) {
      console.error('피드백 제출 중 오류 발생:', err);
      setNotificationMessage('피드백 제출 중 오류가 발생했습니다.');
      setShowNotificationModal(true);
      setIsSubmittingFeedback(false);
    }
  };
  
  // 커뮤니티로 이동
  const goToCommunity = () => {
    router.push('/community');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] pb-20">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center">
            <Link href="/home" className="mr-4">
              <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">매칭 결과</h1>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 매칭 성공 메시지 */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-6"
        >
          <div className="text-center mb-4">
            <div className="bg-pink-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-3">
              <HeartIconSolid className="h-10 w-10 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">매칭이 성공했어요!</h2>
            <p className="text-gray-600 mt-1">
              {matchingData.matchedUser.nickname}님과 매칭되었습니다
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-center mb-3">매칭 점수</h3>
            <div className="relative h-8 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ width: `${matchingData.score}%` }}
              ></div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="font-bold text-gray-800">{matchingData.score}점</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">매칭 이유:</p>
              <ul className="space-y-1">
                {matchingData.compatibility_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 매칭 상대 프로필 */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
        >
          {/* 프로필 헤더 */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden">
                <img 
                  src={matchingData.matchedUser.avatar_url} 
                  alt="프로필 사진" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="pt-20 px-6 pb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {matchingData.matchedUser.nickname}, {matchingData.matchedUser.age}
              </h2>
              <p className="text-gray-600 mt-1">{matchingData.matchedUser.department}</p>
              <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {matchingData.matchedUser.mbti}
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-2">기본 정보</h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">나이:</span> {matchingData.matchedUser.age}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">학과:</span> {matchingData.matchedUser.department}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">MBTI:</span> {matchingData.matchedUser.mbti || '미입력'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">키:</span> {matchingData.matchedUser.height ? `${matchingData.matchedUser.height}cm` : '미입력'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">대학:</span> {matchingData.matchedUser.university || '미입력'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">학년:</span> {matchingData.matchedUser.grade || '미입력'}
                  </p>
                </div>
              </div>

              {/* 생활 스타일 정보 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {matchingData.matchedUser.drinking && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center">
                    <span className="mr-1">🍷</span> {matchingData.matchedUser.drinking}
                  </span>
                )}
                {matchingData.matchedUser.smoking && (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
                    <span className="mr-1">🚬</span> {matchingData.matchedUser.smoking}
                  </span>
                )}
                {matchingData.matchedUser.tattoo && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded flex items-center">
                    <span className="mr-1">🖌️</span> {matchingData.matchedUser.tattoo}
                  </span>
                )}
              </div>

              {matchingData.matchedUser.personalities && matchingData.matchedUser.personalities.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">성격:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchingData.matchedUser.personalities.map((personality, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {personality}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {matchingData.matchedUser.dating_styles && matchingData.matchedUser.dating_styles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">데이트 스타일:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchingData.matchedUser.dating_styles.map((style, index) => (
                      <span key={index} className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {matchingData.matchedUser.lifestyles && matchingData.matchedUser.lifestyles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">생활 스타일:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchingData.matchedUser.lifestyles.map((lifestyle, index) => (
                      <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        {lifestyle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {matchingData.matchedUser.interests && matchingData.matchedUser.interests.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">관심사:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchingData.matchedUser.interests.map((interest, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 연락처 및 액션 버튼 */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-4"
        >
          <h3 className="text-lg font-semibold text-center mb-4">액션</h3>
          
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <a
                href={matchingData.matchedUser.instagram_id ? `https://www.instagram.com/${matchingData.matchedUser.instagram_id}` : '#'}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded flex items-center justify-center"
                onClick={(e) => {
                  if (!matchingData.matchedUser.instagram_id) {
                    e.preventDefault();
                    setNotificationMessage('인스타그램 계정 정보가 없습니다.');
                    setShowNotificationModal(true);
                  }
                }}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                연락하기
              </a>
              <button
                onClick={toggleLike}
                className={`w-12 h-10 flex items-center justify-center rounded ${
                  liked ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'
                }`}
                aria-label="관심 표시"
                title={liked ? "관심 표시 취소" : "관심 표시하기"}
              >
                {liked ? (
                  <HeartIconSolid className="h-5 w-5 text-pink-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <button
              onClick={() => setShowRematchModal(true)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center justify-center"
            >
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              상대가 마음에 들지 않습니다
            </button>
          </div>
        </motion.div>

        {/* 피드백 작성 카드 (별도 카드로 제공) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-6"
        >
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <PencilSquareIcon className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="font-medium text-gray-800">매칭 피드백 남기기</h3>
            </div>
            <p className="text-sm text-gray-600">이 매칭에 대한 솔직한 피드백을 작성해주세요.</p>
          </div>
          
          <div className="mb-3">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 border rounded-md h-24 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="매칭 경험은 어땠나요? 다른 사람들에게 도움이 될 만한 내용을 공유해주세요..."
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={goToCommunity}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              커뮤니티 가기
            </button>
            <button
              onClick={submitFeedback}
              disabled={isSubmittingFeedback || !feedbackText.trim()}
              className={`${
                isSubmittingFeedback || !feedbackText.trim() 
                  ? 'bg-indigo-400' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white py-2 px-4 rounded`}
            >
              {isSubmittingFeedback ? '제출 중...' : '피드백 공유하기'}
            </button>
          </div>
        </motion.div>

        {/* 다음 단계 안내 */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-3">다음은 어떻게 하나요?</h3>
          <ol className="list-decimal ml-5 space-y-2 text-gray-700">
            <li>인스타그램을 통해 연락해 보세요.</li>
            <li>서로에 대해 더 알아가는 시간을 가져보세요.</li>
            <li>편안한 장소에서 만남을 가져보세요.</li>
            <li>매칭 결과에 만족하셨다면 피드백을 남겨주세요.</li>
          </ol>
          <div className="mt-6">
            <Link 
              href="/home"
              className="block w-full bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-lg text-center"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </motion.div>
      </main>

      {/* 리매치 모달 */}
      {showRematchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowRematchModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h3 className="text-xl font-bold mb-4">리매칭 신청</h3>
            
            <div className="mb-6">
              <p className="mb-3">매칭 결과에 만족하지 않으신가요?</p>
              <p className="mb-3">리매칭을 신청하시면 새로운 매칭을 받으실 수 있습니다.</p>
              <div className="bg-yellow-50 p-4 rounded-md mb-4">
                <p className="font-medium text-yellow-700 mb-2">참가비: 2,000원</p>
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 mr-2">계좌번호: 카카오뱅크 전준영 3333225272696</p>
                  <button
                    onClick={copyAccountNumber}
                    className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
                  >
                    {isCopied ? "복사됨" : "복사"}
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-2">예금주: 전준영</p>
                <p 
                  ref={accountNumberRef} 
                  className="absolute opacity-0 pointer-events-none"
                >
                  카카오뱅크 3333-12-3456789
                </p>
              </div>
              <p className="text-sm text-gray-600">
                * 입금 후 리매칭 신청이 완료됩니다. 매칭 시간에 새로운 매칭 결과를 확인해주세요.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRematchModal(false);
                  setNotificationMessage('리매칭 신청이 완료되었습니다. 다음 매칭을 기대해주세요!');
                  setShowNotificationModal(true);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
              >
                신청하기
              </button>
              <button
                onClick={() => setShowRematchModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <p className="text-lg">{notificationMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 