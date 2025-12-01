// AI 채팅 카테고리 타입
export type AIChatCategory = '일상' | '인간관계' | '진로/학교' | '연애';

// AI 채팅 세션 상태 타입
export type AIChatSessionStatus = 'active' | 'completed' | 'analyzing' | 'analyzed' | 'closed';

// AI 채팅 메시지 역할 타입
export type AIChatMessageRole = 'user' | 'assistant';

// AI 채팅 사용자 정보 타입
export interface AIChatUser {
  id: string;
  name: string;
  profileImage: string | null;
}

// AI 채팅 세션 타입
export interface AIChatSession {
  id: string;
  user: AIChatUser;
  category: AIChatCategory;
  turnCount: number;
  status: AIChatSessionStatus;
  isActive: boolean;
  completedAt: string | null;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// AI 채팅 메시지 타입
export interface AIChatMessage {
  id: string;
  sessionId: string;
  role: AIChatMessageRole;
  content: string;
  createdAt: string;
}

// AI 채팅 세션 목록 조회 파라미터 타입
export interface AIChatSessionsParams {
  startDate?: string;
  endDate?: string;
  category?: AIChatCategory;
  isActive?: boolean;
  status?: AIChatSessionStatus;
  userId?: string;
  page?: number;
  limit?: number;
}

// AI 채팅 세션 목록 응답 타입
export interface AIChatSessionsResponse {
  sessions: AIChatSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// AI 채팅 메시지 상세 조회 응답 타입
export interface AIChatMessagesResponse {
  messages: AIChatMessage[];
  total: number;
  session: AIChatSession;
}

// AI 채팅 필터 옵션 타입
export interface AIChatFilterOptions {
  categories: { value: AIChatCategory; label: string }[];
  statuses: { value: AIChatSessionStatus; label: string }[];
  dateRange: {
    start: string;
    end: string;
  };
}

// AI 채팅 통계 타입
export interface AIChatStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  averageTurnCount: number;
  categoryDistribution: {
    category: AIChatCategory;
    count: number;
    percentage: number;
  }[];
}