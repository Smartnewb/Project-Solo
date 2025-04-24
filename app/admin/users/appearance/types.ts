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

// 대학 정보 타입
export interface UniversityDetails {
  id: string;
  name: string;
  emailDomain: string;
  isVerified: boolean;
}

// 유저 프로필 타입 (외모 등급 포함)
export interface UserProfileWithAppearance {
  id: string;
  userId: string;
  name: string;
  email: string;
  gender: Gender;
  age: number;
  profileImages: ProfileImage[];
  universityDetails?: UniversityDetails;
  appearanceGrade: AppearanceGrade;
  instagramId?: string; // 인스타그램 아이디 추가
  createdAt: string;
  updatedAt: string;
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
