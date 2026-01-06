export type SupportSessionStatus = 'bot_handling' | 'waiting_admin' | 'admin_handling' | 'resolved';
export type SupportLanguage = 'ko' | 'ja';
export type SupportSenderType = 'user' | 'bot' | 'admin';

export interface SupportMessageMetadata {
  sources?: {
    question: string;
    answer: string;
    similarity: number;
  }[];
  confidence?: number;
  translatedFrom?: 'ko' | 'ja';
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
