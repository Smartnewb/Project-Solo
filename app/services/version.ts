import axiosServer from '@/utils/axios';

export interface VersionUpdate {
  id: string;
  version: string;
  metadata: {
    description: string[];
  };
  shouldUpdate: boolean;
  createdAt: string;
}

export interface CreateVersionUpdateRequest {
  version: string;
  metadata: {
    description: string[];
  };
  shouldUpdate: boolean;
}

export interface UpdateVersionUpdateRequest {
  version?: string;
  metadata?: {
    description: string[];
  };
  shouldUpdate?: boolean;
}

const versionService = {
  // 새 버전 업데이트 생성
  createVersionUpdate: async (data: CreateVersionUpdateRequest): Promise<VersionUpdate> => {
    try {
      const response = await axiosServer.post('/admin/version-updates', data);
      return response.data;
    } catch (error: any) {
      console.error('버전 업데이트 생성 중 오류:', error);
      throw new Error(error.response?.data?.message || '버전 업데이트 생성에 실패했습니다.');
    }
  },

  // 모든 버전 업데이트 조회
  getAllVersionUpdates: async (): Promise<VersionUpdate[]> => {
    try {
      const response = await axiosServer.get('/admin/version-updates');
      return response.data;
    } catch (error: any) {
      console.error('버전 업데이트 목록 조회 중 오류:', error);
      throw new Error(error.response?.data?.message || '버전 업데이트 목록 조회에 실패했습니다.');
    }
  },

  // 특정 버전 업데이트 조회
  getVersionUpdate: async (id: string): Promise<VersionUpdate> => {
    try {
      const response = await axiosServer.get(`/admin/version-updates/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('버전 업데이트 조회 중 오류:', error);
      throw new Error(error.response?.data?.message || '버전 업데이트 조회에 실패했습니다.');
    }
  },

  // 최신 버전 업데이트 조회
  getLatestVersionUpdate: async (): Promise<VersionUpdate> => {
    try {
      const response = await axiosServer.get('/admin/version-updates/latest');
      return response.data;
    } catch (error: any) {
      console.error('최신 버전 업데이트 조회 중 오류:', error);
      throw new Error(error.response?.data?.message || '최신 버전 업데이트 조회에 실패했습니다.');
    }
  },

  // 버전 업데이트 수정
  updateVersionUpdate: async (id: string, data: UpdateVersionUpdateRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosServer.put(`/admin/version-updates/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('버전 업데이트 수정 중 오류:', error);
      throw new Error(error.response?.data?.message || '버전 업데이트 수정에 실패했습니다.');
    }
  }
};

export default versionService;
