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
};

const AdminService = {
  auth,
  stats,
};

export default AdminService;
