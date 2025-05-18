// 사용자 검색 결과 타입 (외모 등급 API 응답 구조에 맞춤)
export interface UserSearchResult {
  id: string;
  name: string;
  email?: string;
  profileImageUrl?: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
  university?: string | {
    id: string;
    name: string;
    emailDomain: string;
    isVerified: boolean;
  };
  universityDetails?: {
    name: string;
    department?: string;
  };
}

// 매칭 결과 타입
export interface MatchingResult {
  success: boolean;
  partner: UserProfile;
  requester: UserProfile;
  similarity: number;
}

// 매칭 시뮬레이션 결과 타입 (API 응답 구조에 맞게 수정)
export interface MatchingSimulationResult {
  success: boolean;
  message: string;
  requester: UserProfile;
  potentialPartners: {
    profile: UserProfile;
    similarity: number;
  }[];
  selectedPartner: {
    profile: UserProfile;
    similarity: number;
  };
}

// 매칭 대기 사용자 타입
export interface UnmatchedUser {
  id: string;
  name: string;
  age: number;
  gender: string;
  email?: string;
  profileImageUrl?: string;
  university?: string;
  department?: string;
  createdAt: string;
  waitingSince: string;
  appearanceGrade?: string;
}

// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  mbti?: string;
  name: string;
  age: number;
  gender: string;
  rank?: string;
  profileImages?: {
    id: string;
    order: number;
    isMain: boolean;
    url: string;
  }[];
  instagramId?: string;
  universityDetails?: {
    name: string;
    authentication: boolean;
    department: string;
    grade: string;
    studentNumber: string;
  };
  preferences?: {
    typeName: string;
    selectedOptions: {
      id: string;
      displayName: string;
    }[];
  }[];
}
