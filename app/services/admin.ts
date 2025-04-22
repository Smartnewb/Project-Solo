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
};

const AdminService = {
  auth,
  stats,
};

export default AdminService;
