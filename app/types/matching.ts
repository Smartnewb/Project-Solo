// 프로필 타입 정의
export interface Profile {
  id?: string;
  user_id?: string;
  email?: string;
  name?: string;
  nickname?: string;
  student_id?: string;
  age?: number;
  gender?: string;
  is_admin?: boolean;
  role?: string;
  classification?: string;
  avatar_url?: string;
  university?: string;
  department?: string;
  grade?: number;
  instagram_id?: string;
  personalities?: string[];
  dating_styles?: string[];
  lifestyles?: string[];
  interests?: string[];
  drinking?: string;
  smoking?: string;
  tattoo?: string;
  height?: number;
  mbti?: string;
}

// 매칭 상태 enum
export enum MatchStatus {
  PENDING = 'pending',  // 매칭 결과 대기 중
  ACCEPTED = 'accepted',  // 매칭 수락됨
  REJECTED = 'rejected',  // 매칭 거절됨
  EXPIRED = 'expired'  // 응답 시간 만료
}

// 미팅 상태 enum
export enum MeetingStatus {
  PENDING = 'pending',  // 미팅 제안 대기 중
  ACCEPTED = 'accepted',  // 미팅 수락됨
  REJECTED = 'rejected',  // 미팅 거절됨
  CANCELED = 'canceled',  // 미팅 취소됨
  COMPLETED = 'completed'  // 미팅 완료됨
}

// 알림 타입 enum
export enum NotificationType {
  MATCH_RESULT = 'match_result',  // 매칭 결과 알림
  MEETING_INVITATION = 'meeting_invitation',  // 오프라인 미팅 초대 알림
  MEETING_RESPONSE = 'meeting_response',  // 오프라인 미팅 응답 알림
  SYSTEM = 'system'  // 시스템 알림
}

// 매칭 인터페이스
export interface Matching {
  id: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  user1_decision: boolean | null;
  user2_decision: boolean | null;
  score: number;
  created_at: string;
  updated_at: string;
}

// 오프라인 미팅 인터페이스
export interface OfflineMeeting {
  id: string;
  created_at: string;
  initiator_id: string;
  recipient_id: string;
  matching_id: string;
  proposed_date: string;
  proposed_location: string;
  status: MeetingStatus;
  message?: string;
  initiator_profile: UserProfile;
  recipient_profile: UserProfile;
}

// 알림 인터페이스
export interface Notification {
  id: string;
  user_id: string;
  content: string;
  type: NotificationType;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

// 매칭 결정 요청 인터페이스
export interface MatchDecisionRequest {
  matchingId: string;
  decision: boolean;
}

// 미팅 초대 요청 인터페이스
export interface MeetingInvitationRequest {
  matchingId?: string;
  inviteeId: string;
  meetingDate: string;
  location: string;
  notes?: string;
}

// 미팅 응답 요청 인터페이스
export interface MeetingResponseRequest {
  meetingId: string;
  accept: boolean;
}

export interface MatchingResult {
  id: string;
  created_at: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  user1_profile: UserProfile;
  user2_profile: UserProfile;
  current_user_id: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  age?: number;
  gender?: string;
  interests?: string[];
  bio?: string;
  image_url?: string;
} 