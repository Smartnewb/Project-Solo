import axiosServer from '@/utils/axios';

// 타입 정의
interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface TopPageParams extends DateRange {
  limit?: number;
}

// 구글 애널리틱스 API 서비스
const analytics = {
  // 활성 사용자 수 조회
  getActiveUsers: async () => {
    try {
      const response = await axiosServer.get('/admin/analytics/active-users');
      console.log('활성 사용자 수 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('활성 사용자 수 조회 중 오류:', error);
      throw error;
    }
  },

  // 페이지 조회수 조회
  getPageViews: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/page-views', { params });
      console.log('페이지 조회수 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('페이지 조회수 조회 중 오류:', error);
      throw error;
    }
  },

  // 트래픽 소스 조회
  getTrafficSources: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/traffic-sources', { params });
      console.log('트래픽 소스 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('트래픽 소스 조회 중 오류:', error);
      throw error;
    }
  },

  // 사용자 참여도 조회
  getUserEngagement: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/user-engagement', { params });
      console.log('사용자 참여도 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('사용자 참여도 조회 중 오류:', error);
      throw error;
    }
  },

  // 인기 페이지 조회
  getTopPages: async (params?: TopPageParams) => {
    try {
      const response = await axiosServer.get('/admin/analytics/top-pages', { params });
      console.log('인기 페이지 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('인기 페이지 조회 중 오류:', error);
      throw error;
    }
  },

  // 사용자 인구통계 조회
  getUserDemographics: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/user-demographics', { params });
      console.log('사용자 인구통계 응답:', response.data);

      // 응답 형식:
      // {
      //   "countries": [{"country": "South Korea", "users": 709}, ...],
      //   "languages": [{"language": "Korean", "users": 679}, ...],
      //   "cities": [{"city": "Daejeon", "users": 436}, ...],
      //   "period": {"startDate": "2025-03-26", "endDate": "today"}
      // }
      return response.data;
    } catch (error) {
      console.error('사용자 인구통계 조회 중 오류:', error);
      throw error;
    }
  },

  // 디바이스 정보 조회
  getDevices: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/devices', { params });
      console.log('디바이스 정보 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('디바이스 정보 조회 중 오류:', error);
      throw error;
    }
  },

  // 일별 트래픽 조회
  getDailyTraffic: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/daily-traffic', { params });
      console.log('일별 트래픽 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('일별 트래픽 조회 중 오류:', error);
      throw error;
    }
  },

  // 대시보드 데이터 조회
  getDashboardData: async (params?: DateRange) => {
    try {
      const response = await axiosServer.get('/admin/analytics/dashboard', { params });
      console.log('대시보드 데이터 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('대시보드 데이터 조회 중 오류:', error);
      throw error;
    }
  }
};

const AnalyticsService = {
  analytics
};

export default AnalyticsService;
