import { adminApiClient } from '@/lib/api';

// 탈퇴 사유 통계 응답 타입
interface WithdrawalReasonStats {
  totalCount: number;
  stats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

// 서비스 이용 기간별 탈퇴 통계 응답 타입
interface ServiceDurationStats {
  totalCount: number;
  stats: Array<{
    duration: string;
    count: number;
    percentage: number;
  }>;
}

// 탈퇴 관련 서비스
const withdrawalService = {
  // 탈퇴 사유별 통계 조회
  getWithdrawalReasonStats: async (): Promise<WithdrawalReasonStats> => {
    try {
      console.log('탈퇴 사유별 통계 API 요청 시작');
      console.log('API 요청 URL:', '/api/admin/stats/withdrawal/reasons');

      const response = await adminApiClient.get('/api/admin/stats/withdrawal/reasons');
      console.log('탈퇴 사유별 통계 API 응답:', response);

      return response;
    } catch (error) {
      console.error('탈퇴 사유별 통계 조회 중 오류:', error);
      
      // 오류 발생 시 기본값 반환
      return {
        totalCount: 0,
        stats: []
      };
    }
  },

  // 서비스 이용 기간별 탈퇴 통계 조회
  getServiceDurationStats: async (): Promise<ServiceDurationStats> => {
    try {
      console.log('서비스 이용 기간별 탈퇴 통계 API 요청 시작');
      console.log('API 요청 URL:', '/api/admin/stats/withdrawal/service-duration');

      const response = await adminApiClient.get('/api/admin/stats/withdrawal/service-duration');
      console.log('서비스 이용 기간별 탈퇴 통계 API 응답:', response);

      return response;
    } catch (error) {
      console.error('서비스 이용 기간별 탈퇴 통계 조회 중 오류:', error);
      
      // 오류 발생 시 기본값 반환
      return {
        totalCount: 0,
        stats: []
      };
    }
  }
};

export default withdrawalService;
