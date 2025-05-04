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
    try {
      console.log(`사용자 상세 정보 조회 시작: ${userId}`);

      // 여러 가능한 API 경로 시도
      const apiPaths = [
        `/api/admin/users/${userId}/detail`,
        `/admin/users/${userId}/detail`,
        `/api/admin/users/${userId}`,
        `/admin/users/${userId}`,
        `/api/admin/users/detail/${userId}`
      ];

      let response = null;
      let lastError = null;

      // 모든 가능한 경로 시도
      for (const apiPath of apiPaths) {
        try {
          console.log(`API 경로 시도: ${apiPath}`);

          // GET 요청 시도
          response = await adminApiClient.get(apiPath);
          console.log('사용자 상세 정보 응답:', response);

          // 응답 데이터 확인 및 변환
          let userData = response;

          // 응답 구조 확인 및 정규화
          if (response.data && !response.userId) {
            userData = response.data;
          }

          // 대학교 정보 처리
          if (userData.university) {
            userData.universityDetails = {
              ...userData.university,
              name: userData.university.name || userData.universityName || '',
              department: userData.university.department || userData.universityDepartment || '',
              authentication: userData.university.authentication || userData.universityAuthentication || false
            };
          } else if (userData.universityName || userData.universityDepartment) {
            userData.universityDetails = {
              name: userData.universityName || '',
              department: userData.universityDepartment || '',
              authentication: userData.universityAuthentication || false
            };
          }

          // 프로필 이미지 처리
          if (userData.profileImage && !userData.profileImages) {
            userData.profileImages = [
              {
                id: '1',
                url: userData.profileImage,
                isMain: true
              }
            ];
          } else if (!userData.profileImages) {
            userData.profileImages = [];
          }

          // 기본 필드 확인
          userData.userId = userData.userId || userData.id || userId;
          userData.name = userData.name || userData.nickname || '알 수 없음';
          userData.email = userData.email || '';
          userData.gender = userData.gender || 'UNKNOWN';
          userData.age = userData.age || 0;
          userData.status = userData.status || 'ACTIVE';

          console.log('정규화된 사용자 데이터:', userData);
          return userData;
        } catch (err) {
          console.log(`${apiPath} 경로 실패:`, err);
          lastError = err;

          // 다음 경로 시도
          continue;
        }
      }

      // 모든 시도가 실패한 경우, 마지막 오류 던지기
      throw lastError || new Error('모든 API 경로 시도 실패');
    } catch (error) {
      console.error('사용자 상세 정보 조회 오류:', error);

      // 오류 상세 정보 로깅
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }

      throw error;
    }
  },

  // 사용자 프로필 수정
  updateUserProfile: async (userId: string, profileData: Partial<UserDetailInfo>): Promise<UserDetailInfo> => {
    return adminApiClient.patch(`/api/admin/users/${userId}`, profileData);
  },

  // 사용자 계정 상태 변경
  updateAccountStatus: async (userId: string, status: UserStatus, reason?: string): Promise<UserDetailInfo> => {
    try {
      console.log(`사용자 계정 상태 변경 요청: userId=${userId}, status=${status}, reason=${reason || '없음'}`);

      // 요청 데이터 구조 변경 - 백엔드 API 요구사항에 맞게 조정
      // 여러 가능한 데이터 형식 시도
      const requestFormats = [
        { status, reason }, // 기본 형식
        { accountStatus: status, reason }, // 다른 필드명 시도
        { user: { status, reason } }, // 중첩 객체 형식
        { data: { status, reason } }, // 다른 중첩 객체 형식
        { statusUpdate: { status, reason } } // 또 다른 중첩 객체 형식
      ];

      // 여러 가능한 API 경로 시도
      const apiPaths = [
        `/api/admin/users/${userId}/status`,
        `/admin/users/${userId}/status`,
        `/admin/users/status/${userId}`,
        `/api/admin/users/${userId}`,
        `/admin/users/${userId}`
      ];

      let response = null;
      let lastError = null;

      // 모든 가능한 경로와 데이터 형식 조합 시도
      for (const apiPath of apiPaths) {
        for (const requestData of requestFormats) {
          try {
            console.log(`API 경로 시도: ${apiPath}`);
            console.log('요청 데이터:', requestData);

            // PATCH 요청 시도
            response = await adminApiClient.patch(apiPath, requestData);
            console.log('사용자 계정 상태 변경 성공:', response);
            return response;
          } catch (err) {
            console.log(`${apiPath} 경로 실패:`, err);
            lastError = err;

            // 다음 조합 시도
            continue;
          }
        }
      }

      // 모든 시도가 실패한 경우, 마지막 오류 던지기
      throw lastError || new Error('모든 API 경로 시도 실패');
    } catch (error) {
      console.error('사용자 계정 상태 변경 오류:', error);

      // 오류 상세 정보 로깅
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }

      throw error;
    }
  },

  // 사용자 경고 메시지 발송
  sendWarningMessage: async (userId: string, message: string): Promise<{ success: boolean }> => {
    return adminApiClient.post(`/api/admin/users/${userId}/warning`, { message });
  },

  // 사용자 강제 로그아웃
  forceLogout: async (userId: string): Promise<{ success: boolean }> => {
    try {
      console.log(`사용자 강제 로그아웃 요청: userId=${userId}`);

      // 여러 가능한 요청 데이터 형식
      const requestFormats = [
        {}, // 빈 객체
        { userId }, // userId만 포함
        { user: { id: userId } }, // 중첩 객체 형식
        { force: true } // 다른 필드 시도
      ];

      // 여러 가능한 API 경로 시도
      const apiPaths = [
        `/api/admin/users/${userId}/logout`,
        `/admin/users/${userId}/logout`,
        `/admin/users/logout/${userId}`,
        `/api/admin/users/${userId}/force-logout`,
        `/admin/users/${userId}/force-logout`
      ];

      let response = null;
      let lastError = null;

      // 모든 가능한 경로와 데이터 형식 조합 시도
      for (const apiPath of apiPaths) {
        for (const requestData of requestFormats) {
          try {
            console.log(`API 경로 시도: ${apiPath}`);
            console.log('요청 데이터:', requestData);

            // POST 요청 시도
            response = await adminApiClient.post(apiPath, requestData);
            console.log('사용자 강제 로그아웃 성공:', response);
            return response;
          } catch (err) {
            console.log(`${apiPath} 경로 실패:`, err);
            lastError = err;

            // 다음 조합 시도
            continue;
          }
        }
      }

      // 모든 시도가 실패한 경우, 마지막 오류 던지기
      throw lastError || new Error('모든 API 경로 시도 실패');
    } catch (error) {
      console.error('사용자 강제 로그아웃 오류:', error);

      // 오류 상세 정보 로깅
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }

      throw error;
    }
  },

  // 사용자 계정 삭제
  deleteUser: async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`사용자 계정 삭제 요청: userId=${userId}, reason=${reason}`);
      const response = await adminApiClient.delete(`/api/admin/users/${userId}`, {
        data: { reason }
      });
      console.log('사용자 계정 삭제 응답:', response);
      return response;
    } catch (error) {
      console.error('사용자 계정 삭제 오류:', error);
      throw error;
    }
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
    try {
      console.log(`사용자 외모 등급 설정 요청: userId=${userId}, grade=${grade}`);

      // 요청 데이터 로깅
      const requestData = { userId, grade };
      console.log('요청 데이터:', requestData);

      // 백엔드 API 엔드포인트
      const response = await adminApiClient.post('/admin/users/appearance/grade', requestData);
      console.log('사용자 외모 등급 설정 응답:', response);

      // 응답 형식 변환
      return {
        success: true,
        ...response
      };
    } catch (error) {
      console.error('사용자 외모 등급 설정 오류:', error);

      // 오류 상세 정보 로깅
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }

      throw error;
    }
  },

  // 사용자 외모 등급 일괄 설정
  bulkSetUserAppearanceGrade: async (userIds: string[], grade: AppearanceGrade): Promise<{ success: boolean; count: number }> => {
    try {
      console.log(`사용자 외모 등급 일괄 설정 요청: userIds=${userIds.length}개, grade=${grade}`);

      // 요청 데이터 로깅
      const requestData = { userIds, grade };
      console.log('요청 데이터:', requestData);

      // 백엔드 API 엔드포인트
      const response = await adminApiClient.post('/admin/users/appearance/grade/bulk', requestData);
      console.log('사용자 외모 등급 일괄 설정 응답:', response);

      // 응답 형식 변환
      return {
        success: true,
        count: userIds.length,
        ...response
      };
    } catch (error) {
      console.error('사용자 외모 등급 일괄 설정 오류:', error);

      // 오류 상세 정보 로깅
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }

      throw error;
    }
  }
};

export default userService;
