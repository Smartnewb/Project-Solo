import adminAxios from '@/utils/adminAxios';
import { format, subDays } from 'date-fns';

// 타입 정의
interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface TopPageParams extends DateRange {
  limit?: number;
}

// 대시보드 데이터 타입 정의
interface DashboardData {
  overview: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    averageSessionDuration: number;
  };
  dailyUsers: Array<{
    date: string;
    users: number;
  }>;
  topPages: Array<{
    path: string;
    pageViews: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
  deviceCategories: Array<{
    category: string;
    users: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

// 목업 일별 트래픽 데이터 생성 함수
const getMockDailyTrafficData = () => {
  const today = new Date();
  const startDate = subDays(today, 30);

  // 일별 트래픽 데이터 생성
  const dailyTraffic = [];
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    dailyTraffic.push({
      date: format(date, 'yyyy-MM-dd'),
      pageViews: Math.floor(Math.random() * 1000) + 200,
      sessions: Math.floor(Math.random() * 500) + 100,
      users: Math.floor(Math.random() * 300) + 50
    });
  }

  return {
    dailyTraffic: dailyTraffic.reverse(),
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    }
  };
};

// 목업 디바이스 데이터 생성 함수
const getMockDeviceData = () => {
  return {
    devices: [
      { category: '모바일', browser: 'Chrome', users: 1200 },
      { category: '모바일', browser: 'Safari', users: 800 },
      { category: '모바일', browser: 'Samsung Internet', users: 500 },
      { category: '데스크톱', browser: 'Chrome', users: 1000 },
      { category: '데스크톱', browser: 'Firefox', users: 400 },
      { category: '데스크톱', browser: 'Edge', users: 300 },
      { category: '데스크톱', browser: 'Safari', users: 100 },
      { category: '태블릿', browser: 'Chrome', users: 300 },
      { category: '태블릿', browser: 'Safari', users: 200 }
    ],
    period: {
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    }
  };
};

// 목업 인구통계 데이터 생성 함수
const getMockDemographicsData = () => {
  return {
    countries: [
      { country: 'South Korea', users: 3500 },
      { country: 'United States', users: 500 },
      { country: 'Japan', users: 300 },
      { country: 'China', users: 200 },
      { country: 'Other', users: 500 }
    ],
    languages: [
      { language: 'Korean', users: 3800 },
      { language: 'English', users: 700 },
      { language: 'Japanese', users: 200 },
      { language: 'Chinese', users: 150 },
      { language: 'Other', users: 150 }
    ],
    cities: [
      { city: 'Seoul', users: 1500 },
      { city: 'Busan', users: 700 },
      { city: 'Incheon', users: 500 },
      { city: 'Daegu', users: 400 },
      { city: 'Daejeon', users: 300 },
      { city: 'Gwangju', users: 250 },
      { city: 'Ulsan', users: 200 },
      { city: 'Other', users: 1150 }
    ],
    period: {
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    }
  };
};

// 목업 대시보드 데이터 생성 함수
const getMockDashboardData = (): DashboardData => {
  const today = new Date();
  const startDate = subDays(today, 30);

  // 일별 사용자 데이터 생성
  const dailyUsers = [];
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    dailyUsers.push({
      date: format(date, 'yyyy-MM-dd'),
      users: Math.floor(Math.random() * 500) + 100
    });
  }

  return {
    overview: {
      activeUsers: 1250,
      sessions: 3500,
      pageViews: 12000,
      bounceRate: 0.45,
      averageSessionDuration: 180
    },
    dailyUsers: dailyUsers.reverse(),
    topPages: [
      { path: '/', pageViews: 5000 },
      { path: '/login', pageViews: 2500 },
      { path: '/signup', pageViews: 1800 },
      { path: '/profile', pageViews: 1200 },
      { path: '/settings', pageViews: 800 }
    ],
    trafficSources: [
      { source: '직접 접속', sessions: 1500 },
      { source: 'Google', sessions: 1200 },
      { source: 'Naver', sessions: 800 },
      { source: 'Daum', sessions: 500 },
      { source: 'Facebook', sessions: 300 },
      { source: 'Twitter', sessions: 200 },
      { source: 'Instagram', sessions: 150 },
      { source: 'YouTube', sessions: 100 },
      { source: 'Bing', sessions: 50 },
      { source: '기타', sessions: 200 }
    ],
    deviceCategories: [
      { category: '모바일', users: 2500 },
      { category: '데스크톱', users: 1800 },
      { category: '태블릿', users: 500 }
    ],
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    }
  };
};

// 구글 애널리틱스 API 서비스
const analytics = {
  // 활성 사용자 수 조회
  getActiveUsers: async () => {
    try {
      const response = await adminAxios.get('/api/admin/analytics/active-users');
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
      const response = await adminAxios.get('/api/admin/analytics/page-views', { params });
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
      const response = await adminAxios.get('/api/admin/analytics/traffic-sources', { params });
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
      const response = await adminAxios.get('/api/admin/analytics/user-engagement', { params });
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
      const response = await adminAxios.get('/api/admin/analytics/top-pages', { params });
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
      console.log('사용자 인구통계 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return getMockDemographicsData();
      }

      const response = await adminAxios.get('/api/admin/analytics/user-demographics', { params });
      console.log('사용자 인구통계 응답:', response.data);

      // 응답 형식:
      // {
      //   "countries": [{"country": "South Korea", "users": 709}, ...],
      //   "languages": [{"language": "Korean", "users": 679}, ...],
      //   "cities": [{"city": "Daejeon", "users": 436}, ...],
      //   "period": {"startDate": "2025-03-26", "endDate": "today"}
      // }

      if (response.data && Array.isArray(response.data.countries)) {
        return response.data;
      } else {
        console.warn('API 응답 형식이 예상과 다릅니다. 기본값을 반환합니다.');
        return getMockDemographicsData();
      }
    } catch (error: any) {
      console.error('사용자 인구통계 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return getMockDemographicsData(); // 오류 발생 시 기본값 반환
    }
  },

  // 디바이스 정보 조회
  getDevices: async (params?: DateRange) => {
    try {
      console.log('디바이스 정보 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return getMockDeviceData();
      }

      const response = await adminAxios.get('/api/admin/analytics/devices', { params });
      console.log('디바이스 정보 응답:', response.data);

      if (response.data && Array.isArray(response.data.devices)) {
        return response.data;
      } else {
        console.warn('API 응답 형식이 예상과 다릅니다. 기본값을 반환합니다.');
        return getMockDeviceData();
      }
    } catch (error: any) {
      console.error('디바이스 정보 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return getMockDeviceData(); // 오류 발생 시 기본값 반환
    }
  },

  // 일별 트래픽 조회
  getDailyTraffic: async (params?: DateRange) => {
    try {
      console.log('일별 트래픽 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return getMockDailyTrafficData();
      }

      const response = await adminAxios.get('/api/admin/analytics/daily-traffic', { params });
      console.log('일별 트래픽 응답:', response.data);

      if (response.data && Array.isArray(response.data.dailyTraffic)) {
        return response.data;
      } else {
        console.warn('API 응답 형식이 예상과 다릅니다. 기본값을 반환합니다.');
        return getMockDailyTrafficData();
      }
    } catch (error: any) {
      console.error('일별 트래픽 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return getMockDailyTrafficData(); // 오류 발생 시 기본값 반환
    }
  },

  // 대시보드 데이터 조회
  getDashboardData: async (params?: DateRange) => {
    try {
      console.log('대시보드 데이터 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return getMockDashboardData();
      }

      // API 요청 전 로깅
      console.log('대시보드 데이터 API 요청 URL:', '/api/admin/analytics/dashboard');
      console.log('인증 토큰 존재 여부:', !!token);
      console.log('요청 파라미터:', params);

      const response = await adminAxios.get('/api/admin/analytics/dashboard', { params });
      console.log('대시보드 데이터 응답:', response.data);

      // 응답 데이터 확인
      if (response.data && typeof response.data === 'object' && 'overview' in response.data) {
        return response.data;
      } else {
        console.warn('API 응답 형식이 예상과 다릅니다. 기본값을 반환합니다.');
        return getMockDashboardData();
      }
    } catch (error: any) {
      console.error('대시보드 데이터 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return getMockDashboardData(); // 오류 발생 시 기본값 반환
    }
  }
};

const AnalyticsService = {
  analytics
};

export default AnalyticsService;
