export type SupportSessionStatus = 'bot_handling' | 'waiting_admin' | 'admin_handling' | 'resolved';
export type SupportLanguage = 'ko' | 'ja';
export type SupportSenderType = 'user' | 'bot' | 'admin';
export type SupportDomain = 'payment' | 'matching' | 'chat' | 'account' | 'other';
export type SupportPhase = 'asking' | 'answering';

export interface SupportMessageMetadata {
  sources?: {
    question: string;
    answer: string;
    similarity: number;
  }[];
  confidence?: number;
  translatedFrom?: 'ko' | 'ja';
  domain?: SupportDomain;
  collectedInfo?: Record<string, string>;
  phase?: SupportPhase;
}

export interface SupportMessage {
  id: string;
  sessionId: string;
  senderType: SupportSenderType;
  senderId?: string;
  content: string;
  metadata?: SupportMessageMetadata;
  confidence?: number;
  createdAt: string;
}

export interface SupportSession {
  sessionId: string;
  userId: string;
  status: SupportSessionStatus;
  language: SupportLanguage;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportSessionSummary {
  sessionId: string;
  userId: string;
  userNickname?: string;
  status: SupportSessionStatus;
  language: SupportLanguage;
  messageCount: number;
  lastMessage?: string;
  domain?: SupportDomain;
  collectedInfo?: Record<string, string>;
  createdAt: string;
}

export interface SupportSessionUser {
  id: string;
  nickname?: string;
  phoneNumber?: string;
  universityName?: string;
}

export interface SupportSessionDetail {
  sessionId: string;
  user: SupportSessionUser;
  status: SupportSessionStatus;
  language: SupportLanguage;
  assignedAdminId?: string;
  domain?: SupportDomain;
  collectedInfo?: Record<string, string>;
  messages: SupportMessage[];
  createdAt: string;
}

export interface AdminSessionsResponse {
  sessions: SupportSessionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminSessionsParams {
  status?: SupportSessionStatus;
  page?: number;
  limit?: number;
}

export interface TakeoverResponse {
  success: boolean;
  sessionId: string;
  status: 'admin_handling';
  assignedAdminId: string;
}

export interface ResolveResponse {
  success: boolean;
  sessionId: string;
  status: 'resolved';
  resolvedAt: string;
}

export interface ResolveSessionRequest {
  closingMessage?: string;
}

export const SESSION_STATUS_LABELS: Record<SupportSessionStatus, string> = {
  bot_handling: 'AI 응대 중',
  waiting_admin: '어드민 대기',
  admin_handling: '어드민 응대 중',
  resolved: '해결 완료',
};

export const SESSION_STATUS_COLORS: Record<SupportSessionStatus, 'default' | 'warning' | 'primary' | 'success'> = {
  bot_handling: 'default',
  waiting_admin: 'warning',
  admin_handling: 'primary',
  resolved: 'success',
};

export const LANGUAGE_LABELS: Record<SupportLanguage, string> = {
  ko: '한국어',
  ja: '日本語',
};

export const LANGUAGE_FLAGS: Record<SupportLanguage, string> = {
  ko: '🇰🇷',
  ja: '🇯🇵',
};

export const DOMAIN_LABELS: Record<SupportDomain, string> = {
  payment: '💳 결제',
  matching: '💕 매칭',
  chat: '💬 채팅',
  account: '👤 계정',
  other: '📋 기타',
};

export const DOMAIN_COLORS: Record<SupportDomain, 'default' | 'warning' | 'primary' | 'success' | 'error'> = {
  payment: 'warning',
  matching: 'error',
  chat: 'primary',
  account: 'default',
  other: 'default',
};

export const PHASE_LABELS: Record<SupportPhase, string> = {
  asking: '📝 정보 수집',
  answering: '✅ 답변 완료',
};

export const INFO_KEY_LABELS: Record<string, string> = {
  paymentMethod: '결제 수단',
  issueType: '문제 유형',
  errorMessage: '에러 메시지',
  matchingDate: '매칭 일시',
  partnerNickname: '상대방 닉네임',
  chatRoomId: '채팅방 ID',
  accountEmail: '계정 이메일',
  description: '상세 내용',
};
