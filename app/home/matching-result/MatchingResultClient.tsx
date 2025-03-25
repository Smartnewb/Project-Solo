'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/app/utils/formatters';
import MeetingInviteForm from '@/app/components/MeetingInviteForm';
import { MatchStatus } from '@/app/types/matching';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { XMarkIcon, ChatBubbleLeftRightIcon, ExclamationCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface MatchedUser {
  id: string;
  user_id: string;
  nickname: string;
  age?: number;
  gender?: string;
  department?: string;
  mbti?: string;
  height?: number;
  personalities?: string[];
  dating_styles?: string[];
  interests?: string[];
  avatar_url?: string;
  instagram_id?: string;
  university?: string;
  grade?: number;
  drinking?: string;
  smoking?: string;
  tattoo?: string;
  lifestyles?: string[];
}

interface Matching {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  userDecision: boolean | null;
  matchedUser: MatchedUser;
  score?: number;
  compatibility_reasons?: string[];
}

interface MatchingResultClientProps {
  matchings: Matching[];
  userId: string;
  username: string;
}

export default function MatchingResultClient({ matchings, userId, username }: MatchingResultClientProps) {
  const router = useRouter();
  const [selectedMatchingId, setSelectedMatchingId] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [inviteeId, setInviteeId] = useState<string>('');
  const [inviteeName, setInviteeName] = useState<string>('');
  const [likedMatches, setLikedMatches] = useState<Record<string, boolean>>({});
  
  // 알림 및 모달 관련 상태
  const [showRematchModal, setShowRematchModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [currentMatchingId, setCurrentMatchingId] = useState<string>('');
  
  // 계좌번호 복사 관련
  const accountNumberRef = useRef<HTMLParagraphElement>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 피드백 관련 상태
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // 로컬 스토리지에서 관심 표시 상태 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`liked_matches_${userId}`);
      if (saved) {
        setLikedMatches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('관심 표시 상태 로드 오류:', error);
    }
  }, [userId]);

  // 관심 표시 상태 저장
  const savelikedMatches = (newState: Record<string, boolean>) => {
    try {
      localStorage.setItem(`liked_matches_${userId}`, JSON.stringify(newState));
      setLikedMatches(newState);
    } catch (error) {
      console.error('관심 표시 상태 저장 오류:', error);
    }
  };

  // 관심 표시 토글 및 알림 전송
  const toggleLike = async (matchingId: string) => {
    const newState = { ...likedMatches };
    const isLiked = !likedMatches[matchingId];
    newState[matchingId] = isLiked;
    savelikedMatches(newState);
    
    if (isLiked) {
      try {
        // 상대방에게 알림 전송
        const matching = matchings.find(m => m.id === matchingId);
        if (matching) {
          const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiverId: matching.matchedUser.user_id,
              content: `${matching.matchedUser.nickname}님! 매칭된 상대방이 관심을 표시하였습니다!`,
              type: 'like'
            }),
          });
          
          if (response.ok) {
            setNotificationMessage('상대방에게 관심 표시 알림을 보냈습니다.');
            setShowNotificationModal(true);
          }
        }
      } catch (error) {
        console.error('알림 전송 오류:', error);
      }
    }
  };
  
  // 계좌번호 복사 기능
  const copyAccountNumber = () => {
    if (accountNumberRef.current) {
      const accountNumber = accountNumberRef.current.innerText;
      navigator.clipboard.writeText(accountNumber)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error('계좌번호 복사 실패:', err);
        });
    }
  };
  
  // 재매칭 요청 처리
  const handleRematchRequest = async () => {
    try {
      const response = await fetch('/api/admin/rematch-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          matchingId: currentMatchingId
        }),
      });
      
      if (response.ok) {
        setShowRematchModal(false);
        setNotificationMessage('재매칭 요청이 관리자에게 전송되었습니다. 입금 확인 후 처리됩니다.');
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('재매칭 요청 오류:', error);
    }
  };

  // 매칭 결정(수락/거절) 처리
  const handleMatchDecision = async (matchingId: string, decision: boolean) => {
    try {
      const response = await fetch('/api/matchings/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchingId,
          decision,
        }),
      });

      if (!response.ok) {
        throw new Error('매칭 결정 처리에 실패했습니다.');
      }

      // 페이지 새로고침으로 결과 반영
      window.location.reload();

    } catch (error) {
      console.error('매칭 결정 오류:', error);
      alert('매칭 결정을 처리하는 중 오류가 발생했습니다.');
    }
  };

  // 소개팅 초대 양식 표시
  const showMeetingInviteForm = (matching: Matching) => {
    setSelectedMatchingId(matching.id);
    setInviteeId(matching.matchedUser.user_id);
    setInviteeName(matching.matchedUser.nickname);
    setShowInviteForm(true);
  };

  // 소개팅 초대 취소
  const handleCancelInvite = () => {
    setShowInviteForm(false);
    setSelectedMatchingId(null);
  };

  // 소개팅 초대 성공
  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    setSelectedMatchingId(null);
    alert('오프라인 소개팅 초대가 성공적으로 전송되었습니다.');
  };

  // 매칭 상태별 필터링
  const pendingMatchings = matchings.filter(
    m => m.status === MatchStatus.PENDING && m.userDecision === null
  );
  const decidedMatchings = matchings.filter(
    m => m.userDecision !== null && 
    (m.status === MatchStatus.PENDING || 
     m.status === MatchStatus.ACCEPTED || 
     m.status === MatchStatus.REJECTED)
  );

  // 피드백 제출 함수 수정
  const submitFeedback = async () => {
    if (!feedbackText.trim() || !currentMatchingId || !userId) {
      setNotificationMessage('피드백 내용을 입력해주세요.');
      setShowNotificationModal(true);
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      const supabase = createClient();
      
      // 랜덤 이모지 생성
      const emojis = ['😊', '🥰', '😎', '🤗', '😇', '🦊', '🐰', '🐻', '🐼', '🐨', '🦁', '🐯', '🦒', '🦮', '🐶'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      
      // 현재 선택된 매칭 찾기
      const currentMatching = matchings.find(m => m.id === currentMatchingId);
      
      if (!currentMatching) {
        throw new Error('매칭 정보를 찾을 수 없습니다.');
      }

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
            author_id: userId,
            content: `[매칭 피드백] ${feedbackText}`,
            nickname: username || '익명 사용자',
            emoji: randomEmoji,
            created_at: now,
            updated_at: now,
            likes: [],
            reports: [],
            isEdited: false,
            isdeleted: false,
            is_matching_feedback: true,
            matching_score: currentMatching.score,
            matching_reasons: currentMatching.compatibility_reasons
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      setFeedbackText('');
      setNotificationMessage('피드백이 커뮤니티에 공유되었습니다!');
      setShowNotificationModal(true);
    } catch (err) {
      console.error('피드백 제출 중 오류 발생:', err);
      setNotificationMessage('피드백 제출 중 오류가 발생했습니다.');
      setShowNotificationModal(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // 커뮤니티로 이동
  const goToCommunity = () => {
    router.push('/community');
  };

  if (showInviteForm) {
    return (
      <MeetingInviteForm
        matchingId={selectedMatchingId || undefined}
        inviteeId={inviteeId}
        inviteeName={inviteeName}
        onSuccess={handleInviteSuccess}
        onCancel={handleCancelInvite}
      />
    );
  }

  return (
    <div>
      {/* 새로운 매칭 */}
      {pendingMatchings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">새로운 매칭</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingMatchings.map((matching) => (
              <div key={matching.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium">{matching.matchedUser.nickname}</h3>
                    <span className="text-xs text-gray-500">{formatRelativeTime(matching.created_at)}</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm">
                      <span className="font-medium">나이:</span> {matching.matchedUser.age}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">학과:</span> {matching.matchedUser.department}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">MBTI:</span> {matching.matchedUser.mbti || '미입력'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">키:</span> {matching.matchedUser.height ? `${matching.matchedUser.height}cm` : '미입력'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">대학:</span> {matching.matchedUser.university || '미입력'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">학년:</span> {matching.matchedUser.grade || '미입력'}
                    </p>
                    
                    {/* 생활 스타일 정보 */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matching.matchedUser.drinking && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center">
                          <span className="mr-1">🍷</span> {matching.matchedUser.drinking}
                        </span>
                      )}
                      {matching.matchedUser.smoking && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
                          <span className="mr-1">🚬</span> {matching.matchedUser.smoking}
                        </span>
                      )}
                      {matching.matchedUser.tattoo && (
                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded flex items-center">
                          <span className="mr-1">🖌️</span> {matching.matchedUser.tattoo}
                        </span>
                      )}
                    </div>
                    
                    {matching.matchedUser.personalities && matching.matchedUser.personalities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">성격:</p>
                        <div className="flex flex-wrap gap-1">
                          {matching.matchedUser.personalities.map((personality, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {personality}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {matching.matchedUser.dating_styles && matching.matchedUser.dating_styles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">데이트 스타일:</p>
                        <div className="flex flex-wrap gap-1">
                          {matching.matchedUser.dating_styles.map((style, index) => (
                            <span key={index} className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {matching.matchedUser.lifestyles && matching.matchedUser.lifestyles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">생활 스타일:</p>
                        <div className="flex flex-wrap gap-1">
                          {matching.matchedUser.lifestyles.map((lifestyle, index) => (
                            <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                              {lifestyle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {matching.matchedUser.interests && matching.matchedUser.interests.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">관심사:</p>
                        <div className="flex flex-wrap gap-1">
                          {matching.matchedUser.interests.map((interest, index) => (
                            <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMatchDecision(matching.id, true)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleMatchDecision(matching.id, false)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                      거절
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미 결정된 매칭 */}
      {decidedMatchings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">매칭 결정 내역</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {decidedMatchings.map((matching) => {
              const isAccepted = matching.userDecision === true;
              const isMatched = matching.status === MatchStatus.ACCEPTED;
              
              return (
                <div key={matching.id}>
                  {/* 매칭 카드 */}
                  <div 
                    className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 mb-4 ${
                      isAccepted ? 'border-green-500' : 'border-red-500'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium">{matching.matchedUser.nickname}</h3>
                        <div className="flex items-center">
                          <span 
                            className={`text-xs px-2 py-1 rounded ${
                              isAccepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isAccepted ? '수락됨' : '거절됨'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm">
                          <span className="font-medium">나이:</span> {matching.matchedUser.age}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">학과:</span> {matching.matchedUser.department}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">MBTI:</span> {matching.matchedUser.mbti || '미입력'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">키:</span> {matching.matchedUser.height ? `${matching.matchedUser.height}cm` : '미입력'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">대학:</span> {matching.matchedUser.university || '미입력'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">학년:</span> {matching.matchedUser.grade || '미입력'}
                        </p>
                        
                        {/* 생활 스타일 정보 */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {matching.matchedUser.drinking && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center">
                              <span className="mr-1">🍷</span> {matching.matchedUser.drinking}
                            </span>
                          )}
                          {matching.matchedUser.smoking && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
                              <span className="mr-1">🚬</span> {matching.matchedUser.smoking}
                            </span>
                          )}
                          {matching.matchedUser.tattoo && (
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded flex items-center">
                              <span className="mr-1">🖌️</span> {matching.matchedUser.tattoo}
                            </span>
                          )}
                        </div>
                        
                        {matching.matchedUser.personalities && matching.matchedUser.personalities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">성격:</p>
                            <div className="flex flex-wrap gap-1">
                              {matching.matchedUser.personalities.map((personality, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {personality}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {matching.matchedUser.dating_styles && matching.matchedUser.dating_styles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">데이트 스타일:</p>
                            <div className="flex flex-wrap gap-1">
                              {matching.matchedUser.dating_styles.map((style, index) => (
                                <span key={index} className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">
                                  {style}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {matching.matchedUser.lifestyles && matching.matchedUser.lifestyles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">생활 스타일:</p>
                            <div className="flex flex-wrap gap-1">
                              {matching.matchedUser.lifestyles.map((lifestyle, index) => (
                                <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                  {lifestyle}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {matching.matchedUser.interests && matching.matchedUser.interests.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">관심사:</p>
                            <div className="flex flex-wrap gap-1">
                              {matching.matchedUser.interests.map((interest, index) => (
                                <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {isMatched && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <a
                              href={matching.matchedUser.instagram_id ? `https://www.instagram.com/${matching.matchedUser.instagram_id}` : '#'}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded flex items-center justify-center"
                              onClick={(e) => {
                                if (!matching.matchedUser.instagram_id) {
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
                              onClick={() => toggleLike(matching.id)}
                              className={`w-12 h-10 flex items-center justify-center rounded ${
                                likedMatches[matching.id] 
                                  ? 'bg-pink-100 text-pink-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                              aria-label="관심 표시"
                              title={likedMatches[matching.id] ? "관심 표시 취소" : "관심 표시하기"}
                            >
                              {likedMatches[matching.id] ? (
                                <HeartIconSolid className="h-5 w-5 text-pink-500" />
                              ) : (
                                <HeartIconOutline className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentMatchingId(matching.id);
                              setShowRematchModal(true);
                            }}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center justify-center"
                          >
                            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                            상대가 마음에 들지 않습니다
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 피드백 작성 카드 (별도 카드로 제공) */}
                  {isMatched && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 mb-6">
                      <div className="mb-3">
                        <div className="flex items-center mb-2">
                          <PencilSquareIcon className="h-5 w-5 mr-2 text-blue-500" />
                          <h3 className="font-medium text-gray-800">매칭 피드백 남기기</h3>
                        </div>
                        <p className="text-sm text-gray-600">이 매칭에 대한 솔직한 피드백을 작성해주세요.</p>
                      </div>
                      
                      <div className="mb-3">
                        <textarea
                          value={matching.id === currentMatchingId ? feedbackText : ''}
                          onChange={(e) => {
                            setCurrentMatchingId(matching.id);
                            setFeedbackText(e.target.value);
                          }}
                          onClick={() => setCurrentMatchingId(matching.id)}
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
                          disabled={isSubmittingFeedback || !feedbackText.trim() || currentMatchingId !== matching.id}
                          className={`${
                            isSubmittingFeedback || !feedbackText.trim() || currentMatchingId !== matching.id
                              ? 'bg-indigo-400' 
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          } text-white py-2 px-4 rounded`}
                        >
                          {isSubmittingFeedback ? '제출 중...' : '피드백 공유하기'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {matchings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">아직 매칭 정보가 없습니다.</p>
          <Link 
            href="/home" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            홈으로 돌아가기
          </Link>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link 
          href="/home/my-profile/offline" 
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
        >
          오프라인 소개팅 관리
        </Link>
      </div>

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
                  <p className="text-sm text-gray-700 mr-2">계좌번호: 카카오뱅크 3333-22-5272696</p>
                  <button
                    onClick={() => {
                      if (accountNumberRef.current) {
                        navigator.clipboard.writeText("카카오뱅크 3333-22-5272696");
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }
                    }}
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
                  // 실제 리매칭 로직 구현 필요
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