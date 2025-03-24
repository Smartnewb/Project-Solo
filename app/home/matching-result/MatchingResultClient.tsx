'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/app/utils/formatters';
import MeetingInviteForm from '@/app/components/MeetingInviteForm';
import { MatchStatus } from '@/app/types/matching';

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
}

interface Matching {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  userDecision: boolean | null;
  matchedUserDecision: boolean | null;
  matchedUser: MatchedUser;
}

interface MatchingResultClientProps {
  matchings: Matching[];
  userId: string;
}

export default function MatchingResultClient({ matchings, userId }: MatchingResultClientProps) {
  const [selectedMatchingId, setSelectedMatchingId] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [inviteeId, setInviteeId] = useState<string>('');
  const [inviteeName, setInviteeName] = useState<string>('');

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
     m.status === MatchStatus.MATCHED || 
     m.status === MatchStatus.REJECTED)
  );

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

      {/* 결정된 매칭 */}
      {decidedMatchings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">매칭 내역</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {decidedMatchings.map((matching) => {
              const isMatched = matching.status === MatchStatus.MATCHED;
              const statusColor = isMatched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
              const statusText = isMatched ? '매칭 성사' : '매칭 불성사';
              
              return (
                <div 
                  key={matching.id} 
                  className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${isMatched ? 'border-green-500' : 'border-red-400'}`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{matching.matchedUser.nickname}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm">
                        <span className="font-medium">나이:</span> {matching.matchedUser.age}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">학과:</span> {matching.matchedUser.department}
                      </p>
                      
                      {isMatched && matching.matchedUser.instagram_id && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Instagram:</span> {matching.matchedUser.instagram_id}
                        </p>
                      )}
                    </div>
                    
                    {isMatched && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => showMeetingInviteForm(matching)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                        >
                          오프라인 소개팅 제안
                        </button>
                      </div>
                    )}
                  </div>
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
    </div>
  );
} 