import React, { useState } from 'react';
import { MeetingInvitationRequest } from '@/app/types/matching';

interface MeetingInviteFormProps {
  matchingId?: string;
  inviteeId: string;
  inviteeName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MeetingInviteForm: React.FC<MeetingInviteFormProps> = ({
  matchingId,
  inviteeId,
  inviteeName,
  onSuccess,
  onCancel
}) => {
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingDate || !location) {
      setError('날짜와 장소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const meetingData: MeetingInvitationRequest = {
        inviteeId,
        meetingDate,
        location,
        notes
      };

      if (matchingId) {
        meetingData.matchingId = matchingId;
      }

      const response = await fetch('/api/offline-meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '소개팅 초대 전송에 실패했습니다.');
      }

      onSuccess();
    } catch (err) {
      console.error('미팅 초대 전송 오류:', err);
      setError(err instanceof Error ? err.message : '소개팅 초대 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{inviteeName}님에게 오프라인 소개팅 제안하기</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            만남 날짜 및 시간*
          </label>
          <input
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            만남 장소*
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예) 홍대입구역 2번 출구 스타벅스"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메시지 (선택)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="상대방에게 남길 메시지를 입력하세요."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
          />
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? '전송 중...' : '초대 전송'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingInviteForm; 