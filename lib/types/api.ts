// 페이지네이션 응답 타입
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// 사용자 상태 타입
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// 성별 타입
export type Gender = 'MALE' | 'FEMALE';

// 외모 등급 타입
export type AppearanceGrade = 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';

// 사용자 기본 정보 타입
export interface UserBasicInfo {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  age: number;
  gender: Gender;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  profileImage?: string;
  university?: string;
  department?: string;
  appearanceGrade?: AppearanceGrade;
}

// 사용자 상세 정보 타입
export interface UserDetailInfo extends UserBasicInfo {
  phoneNumber?: string;
  address?: string;
  bio?: string;
  interests?: string[];
  isVerified: boolean;
  suspendedReason?: string;
  suspendedUntil?: string;
}

// 게시글 타입
export interface Article {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isBlinded: boolean;
  isDeleted: boolean;
  blindedAt?: string;
  deletedAt?: string;
  blindReason?: string;
}

// 게시글 상세 타입
export interface ArticleDetail extends Article {
  comments: Comment[];
  reports: Report[];
}

// 댓글 타입
export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  isBlinded: boolean;
  isDeleted: boolean;
  blindedAt?: string;
  deletedAt?: string;
  blindReason?: string;
  articleId: string;
}

// 신고 타입
export interface Report {
  id: string;
  targetType: 'article' | 'comment';
  targetId: string;
  reporter: {
    id: string;
    name: string;
  };
  reason: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'processed';
  result?: 'accepted' | 'rejected';
  memo?: string;
}

// 통계 데이터 타입
export interface StatItem {
  grade: string;
  count: number;
  percentage: number;
}

export interface GenderStatItem {
  gender: string;
  stats: StatItem[];
}

export interface AppearanceStats {
  total: number;
  stats: StatItem[];
  genderStats: GenderStatItem[];
}

export interface UniversityStats {
  universities: {
    university: string;
    totalUsers: number;
    maleUsers: number;
    femaleUsers: number;
    percentage: number;
    genderRatio: string;
  }[];
  totalCount: number;
}

export interface GenderStats {
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  malePercentage: number;
  femalePercentage: number;
  genderRatio: string;
}
