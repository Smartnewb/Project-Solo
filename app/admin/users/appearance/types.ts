// 외모 등급 타입
export type AppearanceGrade = 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';

// 성별 타입
export type Gender = 'MALE' | 'FEMALE';

// 프로필 이미지 타입
export interface ProfileImage {
  id: string;
  url: string;
  isMain: boolean;
}

// 대학 정보 타입 (기존)
export interface UniversityDetails {
  id: string;
  name: string;
  emailDomain: string;
  isVerified: boolean;
}

// 대학 정보 타입 (새로운 구조)
export interface University {
  id: string;
  name: string;
  emailDomain: string;
  isVerified: boolean;
  // 추가 필드가 있을 수 있음
}

// 유저 프로필 타입 (외모 등급 포함)
export interface UserProfileWithAppearance {
  id: string;
  userId?: string; // 새로운 응답에서는 없을 수 있음
  name: string;
  email?: string; // 새로운 응답에서는 없을 수 있음
  phoneNumber?: string; // 전화번호
  gender: Gender;
  age: number;
  region?: string; // 지역 정보 (DJN, SJG, CJU, BSN, DGU, GJJ, GHE, ICN, CAN)
  profileImages?: ProfileImage[]; // 새로운 응답에서는 없을 수 있음
  profileImageUrl?: string | null; // 새로운 응답에서 추가됨
  universityDetails?: UniversityDetails; // 기존 필드 (하위 호환성 유지)
  university?: University | string; // 새로운 필드 (객체 또는 문자열)
  universityId?: string; // 대학교 ID만 있을 수도 있음
  universityName?: string; // 대학교 이름만 있을 수도 있음
  appearanceGrade: AppearanceGrade;
  instagramId?: string; // 인스타그램 아이디
  instagramUrl?: string; // 인스타그램 URL
  createdAt: string;
  updatedAt?: string; // 새로운 응답에서는 없을 수 있음
  lastActiveAt?: string | null; // 새로운 응답에서 추가됨
  statusAt?: string | null; // 인스타그램 오류 상태 등을 나타내는 필드
  isUniversityVerified?: boolean; // 대학교 인증 여부
  lastPushNotificationAt?: string | null; // 마지막 푸시 알림 발송 시간
  hasPreferences?: boolean; // 프로필 정보 입력 여부
}

// 페이지네이션 메타 정보
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// 외모 등급 통계 응답 타입
export interface UserAppearanceGradeStatsResponse {
  total: number;
  stats: {
    grade: AppearanceGrade;
    count: number;
    percentage: number;
  }[];
  genderStats: {
    gender: Gender;
    stats: {
      grade: AppearanceGrade;
      count: number;
      percentage: number;
    }[];
  }[];
  // 다른 형식의 응답을 위한 확장 필드
  data?: {
    total?: number;
    stats?: {
      grade: AppearanceGrade;
      count: number;
      percentage: number;
    }[];
    genderStats?: {
      gender: Gender;
      stats: {
        grade: AppearanceGrade;
        count: number;
        percentage: number;
      }[];
    }[];
  };
}

// 외모 등급 설정 요청 타입
export interface SetUserAppearanceGradeRequest {
  userId: string;
  grade: AppearanceGrade;
}

// 외모 등급 일괄 설정 요청 타입
export interface BulkSetUserAppearanceGradeRequest {
  userIds: string[];
  grade: AppearanceGrade;
}

// 외모 등급 설정 응답 타입
export interface SetUserAppearanceGradeResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
}
