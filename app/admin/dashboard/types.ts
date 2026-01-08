// 대시보드 API 타입 정의

// === 통합 요약 API 응답 타입 ===

export interface ActionItem {
  type: string;
  description: string;
  count: number;
  priority: "high" | "medium" | "low";
}

export interface Alert {
  type: "info" | "warning" | "error";
  message: string;
}

export type AlertType =
  | "SIGNUP_DROP"
  | "REPORT_SURGE"
  | "WITHDRAWAL_SURGE"
  | "REVENUE_DROP"
  | "MATCHING_FAILURE_SURGE";

export interface KPI {
  totalUsers: number;
  dailySignups: number;
  matchingRate: number;
  monthlyRevenue: number;
}

export interface MatchingStatus {
  pendingToday: number;
  completedToday: number;
  failedToday: number;
}

export interface DashboardSummaryResponse {
  actionItems: ActionItem[];
  alerts: Alert[];
  kpi: KPI;
  matchingStatus: MatchingStatus;
}

// === 매칭 퍼널 API 타입 ===

export interface FunnelStep {
  stage: string;
  count: number;
  rate: number;
}

export interface ConversionRates {
  matchToView: number;
  viewToLike: number;
  likeToMutual: number;
  mutualToChat: number;
  chatToActive: number;
}

export interface MatchingFunnelResponse {
  funnel: FunnelStep[];
  conversionRates: ConversionRates;
  startDate: string;
  endDate: string;
}

// === 시간별 가입자 추이 API 타입 ===

export interface HourlySignupData {
  hour: number;
  count: number;
}

export interface HourlySignupsResponse {
  data: HourlySignupData[];
  date: string;
  total: number;
}

// === 목표 관리 API 타입 ===

// 백엔드 API에서 사용하는 타입 (소문자)
export type GoalTypeApi = "signups" | "revenue";

// 프론트엔드 UI에서 사용하는 타입 (대문자, 레거시 호환)
export type GoalType = "SIGNUP" | "REVENUE";

// API 타입 <-> UI 타입 변환
export const GOAL_TYPE_TO_API: Record<GoalType, GoalTypeApi> = {
  SIGNUP: "signups",
  REVENUE: "revenue",
};

export const GOAL_TYPE_FROM_API: Record<GoalTypeApi, GoalType> = {
  signups: "SIGNUP",
  revenue: "REVENUE",
};

export interface Goal {
  id: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  achievementRate: number;
  targetMonth: string;
}

export interface GoalCreateRequest {
  type: GoalTypeApi; // API 요청 시 소문자 사용
  targetValue: number;
  targetMonth: string;
}

export interface GoalUpdateRequest {
  targetValue: number;
}

export interface GoalsResponse {
  goals: Goal[];
}

// === 퍼널 스테이지 라벨 매핑 ===
export const FUNNEL_STAGE_LABELS: Record<string, string> = {
  matches_created: "매칭 생성",
  profile_viewed: "프로필 확인",
  like_sent: "좋아요 전송",
  mutual_match: "양방향 매칭",
  chat_started: "채팅 시작",
  active_chat: "활성 채팅",
};

// === 알림 타입 라벨 매핑 ===
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  SIGNUP_DROP: "가입자 감소",
  REPORT_SURGE: "신고 급증",
  WITHDRAWAL_SURGE: "탈퇴 급증",
  REVENUE_DROP: "매출 감소",
  MATCHING_FAILURE_SURGE: "매칭 실패 급증",
};

// === 목표 타입 라벨 매핑 ===
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  SIGNUP: "가입자 수",
  REVENUE: "매출",
};
