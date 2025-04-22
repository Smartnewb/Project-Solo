import axiosServer from '@/utils/axios';

const auth = {
  cleanup: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  },
};

const stats = {
  getTotalUsersCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/total');
      return response.data;
    } catch (error) {
      console.error('총 회원 수 조회 중 오류:', error);
      throw error;
    }
  },
  getDailySignupCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/daily');
      return response.data;
    } catch (error) {
      console.error('오늘 가입한 회원 수 조회 중 오류:', error);
      throw error;
    }
  },
  getWeeklySignupCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/weekly');
      return response.data;
    } catch (error) {
      console.error('이번 주 가입한 회원 수 조회 중 오류:', error);
      throw error;
    }
  },
  getDailySignupTrend: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/trend/daily');
      return response.data;
    } catch (error) {
      console.error('일별 회원가입 추이 조회 중 오류:', error);
      throw error;
    }
  },
  getWeeklySignupTrend: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/trend/weekly');
      return response.data;
    } catch (error) {
      console.error('주별 회원가입 추이 조회 중 오류:', error);
      throw error;
    }
  },
  getMonthlySignupTrend: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/trend/monthly');
      return response.data;
    } catch (error) {
      console.error('월별 회원가입 추이 조회 중 오류:', error);
      throw error;
    }
  },

  // 사용자 지정 기간 회원가입자 수 조회
  getCustomPeriodSignupCount: async (startDate: string, endDate: string) => {
    try {
      console.log('사용자 지정 기간 조회:', startDate, endDate);
      const response = await axiosServer.post('/admin/stats/users/custom-period', {
        startDate,
        endDate
      });

      // 응답 로깅
      console.log('원본 API 응답:', response);
      console.log('응답 데이터:', response.data);

      return response.data;
    } catch (error) {
      console.error('사용자 지정 기간 회원가입자 수 조회 중 오류:', error);
      throw error;
    }
  },

  // 사용자 지정 기간 회원가입 추이 조회
  getCustomPeriodSignupTrend: async (startDate: string, endDate: string) => {
    try {
      console.log('사용자 지정 기간 추이 조회:', startDate, endDate);
      const response = await axiosServer.post('/admin/stats/users/trend/custom-period', {
        startDate,
        endDate
      });

      // 응답 로깅
      console.log('추이 원본 API 응답:', response);
      console.log('추이 응답 데이터:', response.data);

      return response.data;
    } catch (error) {
      console.error('사용자 지정 기간 회원가입 추이 조회 중 오류:', error);
      throw error;
    }
  },
};
// FIX ME
const AdminService = {
  auth,
  stats,
};

export default AdminService;
