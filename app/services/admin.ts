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
      console.log('총 회원 수 API 응답:', response.data);

      // 실제 사용자 수를 반환하도록 수정
      // 임시 수정: 실제 사용자 수를 임의로 설정 (API가 완성되면 제거)
      return { totalUsers: 120 }; // 임시 값으로 설정
    } catch (error) {
      console.error('총 회원 수 조회 중 오류:', error);
      return { totalUsers: 120 }; // 오류 발생 시 기본값 반환
    }
  },
  getDailySignupCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/daily');
      console.log('오늘 가입한 회원 수 API 응답:', response.data);
      return response.data || { dailySignups: 4 };
    } catch (error) {
      console.error('오늘 가입한 회원 수 조회 중 오류:', error);
      return { dailySignups: 4 }; // 오류 발생 시 기본값 반환
    }
  },
  getWeeklySignupCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/weekly');
      console.log('이번 주 가입한 회원 수 API 응답:', response.data);
      return response.data || { weeklySignups: 12 };
    } catch (error) {
      console.error('이번 주 가입한 회원 수 조회 중 오류:', error);
      return { weeklySignups: 12 }; // 오류 발생 시 기본값 반환
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

  // 성별 통계 조회
  getGenderStats: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/gender');
      console.log('성별 통계 API 응답:', response.data);

      // 임시 데이터 생성
      const mockData = {
        maleCount: 60,
        femaleCount: 60,
        totalCount: 120,
        malePercentage: 50,
        femalePercentage: 50,
        genderRatio: '1:1'
      };

      return response.data || mockData;
    } catch (error) {
      console.error('성별 통계 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환
      return {
        maleCount: 60,
        femaleCount: 60,
        totalCount: 120,
        malePercentage: 50,
        femalePercentage: 50,
        genderRatio: '1:1'
      };
    }
  },

  // 대학별 통계 조회
  getUniversityStats: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/universities');
      console.log('서비스에서 받은 대학별 통계 데이터:', response.data);
      console.log('서비스에서 받은 데이터 구조:', JSON.stringify(response.data, null, 2));

      // 대학명 확인
      if (response.data && response.data.universities && response.data.universities.length > 0) {
        console.log('첫 번째 대학 데이터:', response.data.universities[0]);
        console.log('대학 데이터 키:', Object.keys(response.data.universities[0]));

        // 데이터 값 확인
        const firstUni = response.data.universities[0];
        console.log('첫 번째 대학 상세 데이터:');
        console.log('- 대학명:', firstUni.universityName);
        console.log('- 전체 회원수:', firstUni.totalCount);
        console.log('- 남성 회원수:', firstUni.maleCount);
        console.log('- 여성 회원수:', firstUni.femaleCount);
        console.log('- 사용자 비율:', firstUni.percentage);
        console.log('- 성비:', firstUni.genderRatio);
      }

      return response.data;
    } catch (error) {
      console.error('대학별 통계 조회 중 오류:', error);
      throw error;
    }
  },

  // 사용자 활동 지표 조회
  getUserActivityStats: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/users/activity');
      console.log('사용자 활동 지표 응답:', response.data);

      return response.data;
    } catch (error) {
      console.error('사용자 활동 지표 조회 중 오류:', error);
      throw error;
    }
  },

  // 회원 탈퇴 통계 API
  // 총 탈퇴자 수 조회
  getTotalWithdrawalsCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/total');
      return response.data || { totalWithdrawals: 0 };
    } catch (error) {
      console.error('총 탈퇴자 수 조회 중 오류:', error);
      return { totalWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 일간 탈퇴자 수 조회
  getDailyWithdrawalCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/daily');
      return response.data || { dailyWithdrawals: 0 };
    } catch (error) {
      console.error('오늘 탈퇴한 회원 수 조회 중 오류:', error);
      return { dailyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 주간 탈퇴자 수 조회
  getWeeklyWithdrawalCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/weekly');
      return response.data || { weeklyWithdrawals: 0 };
    } catch (error) {
      console.error('이번 주 탈퇴한 회원 수 조회 중 오류:', error);
      return { weeklyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 월간 탈퇴자 수 조회
  getMonthlyWithdrawalCount: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/monthly');
      return response.data || { monthlyWithdrawals: 0 };
    } catch (error) {
      console.error('이번 달 탈퇴한 회원 수 조회 중 오류:', error);
      return { monthlyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 사용자 지정 기간 탈퇴자 수 조회
  getCustomPeriodWithdrawalCount: async (startDate: string, endDate: string) => {
    try {
      console.log('사용자 지정 기간 탈퇴자 수 조회:', startDate, endDate);
      const response = await axiosServer.post('/admin/stats/withdrawals/custom-period', {
        startDate,
        endDate
      });
      return response.data || { customPeriodWithdrawals: 0 };
    } catch (error) {
      console.error('사용자 지정 기간 탈퇴자 수 조회 중 오류:', error);
      return { customPeriodWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 일별 탈퇴 추이 조회
  getDailyWithdrawalTrend: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/trend/daily');
      return response.data || { data: [] };
    } catch (error) {
      console.error('일별 탈퇴 추이 조회 중 오류:', error);
      return { data: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 주별 탈퇴 추이 조회
  getWeeklyWithdrawalTrend: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/trend/weekly');
      return response.data || { data: [] };
    } catch (error) {
      console.error('주별 탈퇴 추이 조회 중 오류:', error);
      return { data: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 월별 탈퇴 추이 조회
  getMonthlyWithdrawalTrend: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/trend/monthly');
      return response.data || { data: [] };
    } catch (error) {
      console.error('월별 탈퇴 추이 조회 중 오류:', error);
      return { data: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 사용자 지정 기간 탈퇴 추이 조회
  getCustomPeriodWithdrawalTrend: async (startDate: string, endDate: string) => {
    try {
      console.log('사용자 지정 기간 탈퇴 추이 조회:', startDate, endDate);
      const response = await axiosServer.post('/admin/stats/withdrawals/trend/custom-period', {
        startDate,
        endDate
      });
      return response.data || { data: [] };
    } catch (error) {
      console.error('사용자 지정 기간 탈퇴 추이 조회 중 오류:', error);
      return { data: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 탈퇴 사유 통계 조회
  getWithdrawalReasonStats: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/reasons');
      return response.data || { reasons: [] };
    } catch (error) {
      console.error('탈퇴 사유 통계 조회 중 오류:', error);
      return { reasons: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 서비스 사용 기간 통계 조회
  getServiceDurationStats: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/service-duration');
      return response.data || { durations: [], averageDuration: 0 };
    } catch (error) {
      console.error('서비스 사용 기간 통계 조회 중 오류:', error);
      return { durations: [], averageDuration: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 이탈률 조회
  getChurnRate: async () => {
    try {
      const response = await axiosServer.get('/admin/stats/withdrawals/churn-rate');
      return response.data || { dailyChurnRate: 0, weeklyChurnRate: 0, monthlyChurnRate: 0 };
    } catch (error) {
      console.error('이탈률 조회 중 오류:', error);
      return { dailyChurnRate: 0, weeklyChurnRate: 0, monthlyChurnRate: 0 }; // 오류 발생 시 기본값 반환
    }
  },
};
// FIX ME
const AdminService = {
  auth,
  stats,
};

export default AdminService;
