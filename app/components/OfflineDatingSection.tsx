'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OfflineMeeting, MeetingStatus } from '@/app/types/matching';
import { formatDate } from '@/app/utils/formatters';

interface OfflineDatingSectionProps {
  title: string;
}

const OfflineDatingSection: React.FC<OfflineDatingSectionProps> = ({ title }) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<OfflineMeeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/offline-meetings');
      
      if (!response.ok) {
        throw new Error('미팅 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setMeetings(data.meetings || []);
      setError(null);
    } catch (err) {
      console.error('미팅 불러오기 오류:', err);
      setError('미팅 정보를 불러오는 중 오류가 발생했습니다.');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMeeting = async (meetingId: string) => {
    try {
      const response = await fetch('/api/offline-meetings/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          accept: true,
        }),
      });

      if (!response.ok) {
        throw new Error('미팅 초대 수락에 실패했습니다.');
      }

      // 미팅 목록 새로고침
      fetchMeetings();
    } catch (err) {
      console.error('미팅 초대 수락 오류:', err);
      setError('미팅 초대 수락 중 오류가 발생했습니다.');
    }
  };

  const handleRejectMeeting = async (meetingId: string) => {
    try {
      const response = await fetch('/api/offline-meetings/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          accept: false,
        }),
      });

      if (!response.ok) {
        throw new Error('미팅 초대 거절에 실패했습니다.');
      }

      // 미팅 목록 새로고침
      fetchMeetings();
    } catch (err) {
      console.error('미팅 초대 거절 오류:', err);
      setError('미팅 초대 거절 중 오류가 발생했습니다.');
    }
  };

  // 상태별 미팅 필터링
  const pendingMeetings = meetings.filter(meeting => meeting.status === MeetingStatus.PENDING && meeting.initiator_id !== user?.id);
  const confirmedMeetings = meetings.filter(meeting => meeting.status === MeetingStatus.ACCEPTED);
  const myInvitations = meetings.filter(meeting => meeting.initiator_id === user?.id);

  if (loading) {
    return <div className="p-4 text-center">미팅 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      {/* 대기 중인 초대 */}
      {pendingMeetings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">받은 초대</h3>
          <div className="space-y-4">
            {pendingMeetings.map(meeting => (
              <div key={meeting.id} className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{meeting.initiator_profile?.nickname}님의 초대</p>
                    <p className="text-sm text-gray-600">
                      날짜: {formatDate(meeting.proposed_date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      장소: {meeting.proposed_location}
                    </p>
                    {meeting.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        메시지: {meeting.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => handleAcceptMeeting(meeting.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                    >
                      수락
                    </button>
                    <button 
                      onClick={() => handleRejectMeeting(meeting.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
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

      {/* 확정된 미팅 */}
      {confirmedMeetings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">확정된 미팅</h3>
          <div className="space-y-4">
            {confirmedMeetings.map(meeting => (
              <div key={meeting.id} className="border rounded-lg p-4 bg-green-50">
                <p className="font-medium">{meeting.initiator_profile?.nickname}님과의 미팅</p>
                <p className="text-sm text-gray-600">
                  날짜: {formatDate(meeting.proposed_date)}
                </p>
                <p className="text-sm text-gray-600">
                  장소: {meeting.proposed_location}
                </p>
                {meeting.message && (
                  <p className="text-sm text-gray-600 mt-1">
                    메모: {meeting.message}
                  </p>
                )}
                <div className="mt-2">
                  <p className="text-sm">
                    Instagram: {meeting.recipient_profile?.instagram_id || '미등록'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내가 보낸 초대 */}
      {myInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">보낸 초대</h3>
          <div className="space-y-4">
            {myInvitations.map(meeting => (
              <div key={meeting.id} className="border rounded-lg p-4 bg-blue-50">
                <p className="font-medium">{meeting.initiator_profile?.nickname}님에게 보낸 초대</p>
                <p className="text-sm text-gray-600">
                  상태: {
                    meeting.status === MeetingStatus.PENDING ? '대기 중' :
                    meeting.status === MeetingStatus.ACCEPTED ? '수락됨' :
                    meeting.status === MeetingStatus.REJECTED ? '거절됨' :
                    meeting.status === MeetingStatus.CANCELED ? '취소됨' : '완료'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  날짜: {formatDate(meeting.proposed_date)}
                </p>
                <p className="text-sm text-gray-600">
                  장소: {meeting.proposed_location}
                </p>
                {meeting.message && (
                  <p className="text-sm text-gray-600 mt-1">
                    메시지: {meeting.message}
                  </p>
                )}
                {meeting.status === MeetingStatus.ACCEPTED && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Instagram: {meeting.recipient_profile?.instagram_id || '미등록'}
                      </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingMeetings.length === 0 && confirmedMeetings.length === 0 && myInvitations.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          아직 오프라인 소개팅 정보가 없습니다.
        </div>
      )}
    </div>
  );
};

export default OfflineDatingSection; 