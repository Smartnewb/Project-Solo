import { adminApiClient } from '@/lib/api';
import {
  UserBasicInfo,
  UserDetailInfo,
  UserStatus,
  PaginatedResponse,
  AppearanceGrade
} from '@/lib/types/api';

// 사용자 목록 조회 파라미터
export interface GetUsersParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  universityName?: string;
  minAge?: number;
  maxAge?: number;
  gender?: 'MALE' | 'FEMALE';
}

// 사용자 관리 서비스
const userService = {
  // 사용자 목록 조회
  getUsers: async (params: GetUsersParams = {}): Promise<PaginatedResponse<UserBasicInfo>> => {
    return adminApiClient.get('/api/admin/users', { params });
  },

  // 사용자 상세 정보 조회
  getUserDetails: async (userId: string): Promise<UserDetailInfo> => {
    return adminApiClient.get(`/api/admin/users/${userId}/detail`);
  },

  // 사용자 프로필 수정
  updateUserProfile: async (userId: string, profileData: Partial<UserDetailInfo>): Promise<UserDetailInfo> => {
    return adminApiClient.patch(`/api/admin/users/${userId}`, profileData);
  },

  // 사용자 계정 상태 변경
  updateAccountStatus: async (userId: string, status: UserStatus, reason?: string): Promise<UserDetailInfo> => {
    return adminApiClient.patch(`/api/admin/users/${userId}/status`, { status, reason });
  },

  // 사용자 경고 메시지 발송
  sendWarningMessage: async (userId: string, message: string): Promise<{ success: boolean }> => {
    return adminApiClient.post(`/api/admin/users/${userId}/warning`, { message });
  },

  // 사용자 강제 로그아웃
  forceLogout: async (userId: string): Promise<{ success: boolean }> => {
    return adminApiClient.post(`/api/admin/users/${userId}/logout`, {});
  },

  // 사용자 계정 삭제
  deleteUser: async (userId: string, reason: string): Promise<{ success: boolean }> => {
    return adminApiClient.delete(`/api/admin/users/${userId}`, {
      data: { reason }
    });
  },

  // 사용자 프로필 수정 요청 발송
  sendProfileUpdateRequest: async (userId: string, message: string): Promise<{ success: boolean }> => {
    return adminApiClient.post(`/api/admin/users/${userId}/profile-update-request`, { message });
  },

  // 외모 등급 정보를 포함한 사용자 목록 조회
  getUsersWithAppearanceGrade: async (params: GetUsersParams & { appearanceGrade?: AppearanceGrade } = {}): Promise<PaginatedResponse<UserBasicInfo>> => {
    return adminApiClient.get('/api/admin/users/appearance', { params });
  },

  // 미분류 사용자 목록 조회
  getUnclassifiedUsers: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<UserBasicInfo>> => {
    return adminApiClient.get('/api/admin/users/appearance', {
      params: {
        page,
        limit,
        appearanceGrade: 'UNKNOWN'
      }
    });
  },

  // 사용자 외모 등급 설정
  setUserAppearanceGrade: async (userId: string, grade: AppearanceGrade): Promise<{ success: boolean }> => {
    return adminApiClient.patch(`/api/admin/users/${userId}/appearance`, { grade });
  },

  // 사용자 외모 등급 일괄 설정
  bulkSetUserAppearanceGrade: async (userIds: string[], grade: AppearanceGrade): Promise<{ success: boolean; count: number }> => {
    return adminApiClient.patch('/api/admin/users/appearance/bulk', { userIds, grade });
  }
};

export default userService;
