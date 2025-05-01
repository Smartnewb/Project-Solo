import adminAxios from '@/utils/adminAxios';

// axiosServer 변수 정의 (adminAxios와 동일하게 사용)
const axiosServer = adminAxios;

// 상단에 타입 정의 추가
interface StatItem {
  grade: string;
  count: number;
  percentage: number;
}

interface GenderStatItem {
  gender: string;
  stats: StatItem[];
}

interface FormattedData {
  total: number;
  stats: StatItem[];
  genderStats: GenderStatItem[];
}

// 성별 통계 목업 데이터 생성 함수
const getMockGenderStats = () => {
  return {
    maleCount: 60,
    femaleCount: 60,
    totalCount: 120,
    malePercentage: 50,
    femalePercentage: 50,
    genderRatio: '1:1'
  };
};

// 대학별 통계 목업 데이터 생성 함수
const getMockUniversityStats = () => {
  // 대학 목록
  const universities = [
    '건양대학교(메디컬캠퍼스)',
    '대전대학교',
    '목원대학교',
    '배재대학교',
    '우송대학교',
    '한남대학교',
    '충남대학교',
    'KAIST',
    '한밭대학교',
    '을지대학교',
    '대전보건대학교',
    '대덕대학교'
  ];

  // 총 회원 수 (임의 설정)
  const totalCount = 1200;

  // 대학별 통계 데이터 생성
  const universitiesData = universities.map(uni => {
    // 임의의 회원 수 생성 (50~300 사이)
    const totalUsers = Math.floor(Math.random() * 250) + 50;

    // 임의의 성별 비율 생성
    const maleRatio = Math.random() * 0.6 + 0.2; // 20%~80% 사이
    const maleUsers = Math.floor(totalUsers * maleRatio);
    const femaleUsers = totalUsers - maleUsers;

    // 전체 대비 비율 계산
    const percentage = (totalUsers / totalCount) * 100;

    // 성비 계산 (남:여)
    const gcdValue = gcd(maleUsers, femaleUsers);
    const maleRatioSimplified = maleUsers / gcdValue || 0;
    const femaleRatioSimplified = femaleUsers / gcdValue || 0;
    const genderRatio = `${maleRatioSimplified}:${femaleRatioSimplified}`;

    return {
      university: uni,
      totalUsers,
      maleUsers,
      femaleUsers,
      percentage,
      genderRatio
    };
  });

  return {
    universities: universitiesData,
    totalCount
  };
};

// 최대공약수 계산 함수 (성비 계산에 사용)
const gcd = (a: number, b: number): number => {
  if (!b) return a;
  return gcd(b, a % b);
};

const auth = {
  cleanup: () => {
    localStorage.removeItem('admin_access_token');
  },

  // 어드민 로그인 상태 확인
  checkAuth: async () => {
    try {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        return { isAuthenticated: false };
      }

      const response = await adminAxios.get('/api/auth/me');
      return {
        isAuthenticated: true,
        user: response.data
      };
    } catch (error) {
      console.error('어드민 인증 확인 오류:', error);
      return { isAuthenticated: false };
    }
  },
};

const stats = {
  getTotalUsersCount: async () => {
    try {
      console.log('총 회원 수 API 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return { totalUsers: 120 };
      }

      // API 요청 전 로깅
      console.log('총 회원 수 API 요청 URL:', '/api/admin/stats/users/total');
      console.log('인증 토큰 존재 여부:', !!token);

      const response = await adminAxios.get('/api/admin/stats/users/total');
      console.log('총 회원 수 API 응답:', response.data);

      // 응답 데이터 확인
      if (response.data && typeof response.data.totalUsers === 'number') {
        return { totalUsers: response.data.totalUsers };
      } else {
        console.warn('API 응답에 totalUsers가 없습니다. 기본값을 반환합니다.');
        return { totalUsers: 120 };
      }
    } catch (error: any) {
      console.error('총 회원 수 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return { totalUsers: 120 }; // 오류 발생 시 기본값 반환
    }
  },
  getDailySignupCount: async () => {
    try {
      console.log('오늘 가입한 회원 수 API 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return { dailySignups: 4 };
      }

      // API 요청 전 로깅
      console.log('오늘 가입한 회원 수 API 요청 URL:', '/api/admin/stats/users/daily');
      console.log('인증 토큰 존재 여부:', !!token);

      const response = await axiosServer.get('/api/admin/stats/users/daily');
      console.log('오늘 가입한 회원 수 API 응답:', response.data);

      // 응답 데이터 확인 및 필드명 변환
      if (response.data) {
        // 가능한 필드명 확인
        const possibleFields = ['dailySignups', 'dailyCount', 'count', 'total'];

        // 응답 데이터에서 값 찾기
        let dailySignups = 4; // 기본값

        for (const field of possibleFields) {
          if (typeof response.data[field] === 'number') {
            dailySignups = response.data[field];
            console.log(`필드 '${field}'에서 값을 찾았습니다:`, dailySignups);
            break;
          }
        }

        // 응답 데이터가 직접 숫자인 경우
        if (typeof response.data === 'number') {
          dailySignups = response.data;
          console.log('응답 데이터가 직접 숫자입니다:', dailySignups);
        }

        return { dailySignups };
      }

      return { dailySignups: 4 }; // 기본값 반환
    } catch (error: any) {
      console.error('오늘 가입한 회원 수 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return { dailySignups: 4 }; // 오류 발생 시 기본값 반환
    }
  },
  getWeeklySignupCount: async () => {
    try {
      console.log('이번 주 가입한 회원 수 API 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return { weeklySignups: 12 };
      }

      // API 요청 전 로깅
      console.log('이번 주 가입한 회원 수 API 요청 URL:', '/api/admin/stats/users/weekly');
      console.log('인증 토큰 존재 여부:', !!token);

      const response = await axiosServer.get('/api/admin/stats/users/weekly');
      console.log('이번 주 가입한 회원 수 API 응답:', response.data);

      // 응답 데이터 확인 및 필드명 변환
      if (response.data) {
        // 가능한 필드명 확인
        const possibleFields = ['weeklySignups', 'weeklyCount', 'count', 'total'];

        // 응답 데이터에서 값 찾기
        let weeklySignups = 12; // 기본값

        for (const field of possibleFields) {
          if (typeof response.data[field] === 'number') {
            weeklySignups = response.data[field];
            console.log(`필드 '${field}'에서 값을 찾았습니다:`, weeklySignups);
            break;
          }
        }

        // 응답 데이터가 직접 숫자인 경우
        if (typeof response.data === 'number') {
          weeklySignups = response.data;
          console.log('응답 데이터가 직접 숫자입니다:', weeklySignups);
        }

        return { weeklySignups };
      }

      return { weeklySignups: 12 }; // 기본값 반환
    } catch (error: any) {
      console.error('이번 주 가입한 회원 수 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return { weeklySignups: 12 }; // 오류 발생 시 기본값 반환
    }
  },
  getDailySignupTrend: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/users/trend/daily');
      return response.data;
    } catch (error) {
      console.error('일별 회원가입 추이 조회 중 오류:', error);
      throw error;
    }
  },
  getWeeklySignupTrend: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/users/trend/weekly');
      return response.data;
    } catch (error) {
      console.error('주별 회원가입 추이 조회 중 오류:', error);
      throw error;
    }
  },
  getMonthlySignupTrend: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/users/trend/monthly');
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
      const response = await axiosServer.post('/api/admin/stats/users/custom-period', {
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
      const response = await axiosServer.post('/api/admin/stats/users/trend/custom-period', {
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
      console.log('성별 통계 API 요청 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return getMockGenderStats();
      }

      // API 요청 전 로깅
      console.log('성별 통계 API 요청 URL:', '/api/admin/stats/users/gender');
      console.log('인증 토큰 존재 여부:', !!token);

      const response = await axiosServer.get('/api/admin/stats/users/gender');
      console.log('성별 통계 API 응답:', response.data);

      // 응답 데이터 확인 및 필드명 변환
      if (response.data) {
        // 필드명 매핑 정의
        const fieldMappings: Record<string, string> = {
          'male': 'maleCount',
          'female': 'femaleCount',
          'total': 'totalCount',
          'maleRatio': 'malePercentage',
          'femaleRatio': 'femalePercentage',
          'ratio': 'genderRatio'
        };

        // 변환된 데이터 객체 생성
        const transformedData: Record<string, any> = {};

        // 응답 데이터의 각 필드 확인
        for (const [apiField, expectedField] of Object.entries(fieldMappings)) {
          if (response.data[apiField] !== undefined) {
            transformedData[expectedField] = response.data[apiField];
            console.log(`필드 '${apiField}'를 '${expectedField}'로 변환했습니다:`, response.data[apiField]);
          }
        }

        // 필수 필드가 있는지 확인
        const requiredFields = ['maleCount', 'femaleCount', 'totalCount'];
        const hasAllRequiredFields = requiredFields.every(field => transformedData[field] !== undefined);

        if (hasAllRequiredFields) {
          // 백분율 계산 (없는 경우)
          if (transformedData.malePercentage === undefined && transformedData.totalCount > 0) {
            transformedData.malePercentage = (transformedData.maleCount / transformedData.totalCount) * 100;
          }

          if (transformedData.femalePercentage === undefined && transformedData.totalCount > 0) {
            transformedData.femalePercentage = (transformedData.femaleCount / transformedData.totalCount) * 100;
          }

          // 성비 계산 (없는 경우)
          if (transformedData.genderRatio === undefined) {
            const gcdValue = gcd(transformedData.maleCount, transformedData.femaleCount);
            const maleRatio = transformedData.maleCount / gcdValue || 0;
            const femaleRatio = transformedData.femaleCount / gcdValue || 0;
            transformedData.genderRatio = `${maleRatio}:${femaleRatio}`;
          }

          return transformedData;
        }
      }

      // 데이터가 없거나 형식이 다른 경우 목업 데이터 반환
      console.warn('API 응답에 성별 통계 데이터가 없거나 형식이 다릅니다. 기본값을 반환합니다.');
      return getMockGenderStats();
    } catch (error: any) {
      console.error('성별 통계 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return getMockGenderStats(); // 오류 발생 시 기본값 반환
    }
  },

  // 대학별 통계 조회
  getUniversityStats: async () => {
    try {
      console.log('대학별 통계 조회 시작');

      // 토큰 확인
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('어드민 토큰이 없습니다. 기본값을 반환합니다.');
        return getMockUniversityStats();
      }

      // API 요청 전 로깅
      console.log('대학별 통계 API 요청 URL:', '/api/admin/stats/users/universities');
      console.log('인증 토큰 존재 여부:', !!token);

      const response = await axiosServer.get('/api/admin/stats/users/universities');
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

        // 필드명 변환
        const transformedData = {
          universities: response.data.universities.map(uni => ({
            university: uni.universityName,
            totalUsers: uni.totalCount,
            maleUsers: uni.maleCount,
            femaleUsers: uni.femaleCount,
            percentage: uni.percentage,
            genderRatio: uni.genderRatio
          })),
          totalCount: response.data.totalCount
        };

        console.log('변환된 대학별 통계 데이터:', transformedData);
        return transformedData;
      }

      // 데이터가 없거나 형식이 다른 경우 목업 데이터 반환
      console.warn('API 응답에 대학별 통계 데이터가 없거나 형식이 다릅니다. 기본값을 반환합니다.');
      return getMockUniversityStats();
    } catch (error: any) {
      console.error('대학별 통계 조회 중 오류:', error.message);
      if (error.response) {
        console.error('오류 상태 코드:', error.response.status);
        console.error('오류 응답 데이터:', error.response.data);
      }
      return getMockUniversityStats(); // 오류 발생 시 기본값 반환
    }
  },

  // 사용자 활동 지표 조회
  getUserActivityStats: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/users/activity');
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
      const response = await axiosServer.get('/api/admin/stats/withdrawals/total');
      return response.data || { totalWithdrawals: 0 };
    } catch (error) {
      console.error('총 탈퇴자 수 조회 중 오류:', error);
      return { totalWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 일간 탈퇴자 수 조회
  getDailyWithdrawalCount: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/daily');
      return response.data || { dailyWithdrawals: 0 };
    } catch (error) {
      console.error('오늘 탈퇴한 회원 수 조회 중 오류:', error);
      return { dailyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 주간 탈퇴자 수 조회
  getWeeklyWithdrawalCount: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/weekly');
      return response.data || { weeklyWithdrawals: 0 };
    } catch (error) {
      console.error('이번 주 탈퇴한 회원 수 조회 중 오류:', error);
      return { weeklyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 월간 탈퇴자 수 조회
  getMonthlyWithdrawalCount: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/monthly');
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
      const response = await axiosServer.post('/api/admin/stats/withdrawals/custom-period', {
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
      const response = await axiosServer.get('/api/admin/stats/withdrawals/trend/daily');
      return response.data || { data: [] };
    } catch (error) {
      console.error('일별 탈퇴 추이 조회 중 오류:', error);
      return { data: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 주별 탈퇴 추이 조회
  getWeeklyWithdrawalTrend: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/trend/weekly');
      return response.data || { data: [] };
    } catch (error) {
      console.error('주별 탈퇴 추이 조회 중 오류:', error);
      return { data: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 월별 탈퇴 추이 조회
  getMonthlyWithdrawalTrend: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/trend/monthly');
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
      const response = await axiosServer.post('/api/admin/stats/withdrawals/trend/custom-period', {
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
      const response = await axiosServer.get('/api/admin/stats/withdrawals/reasons');
      return response.data || { reasons: [] };
    } catch (error) {
      console.error('탈퇴 사유 통계 조회 중 오류:', error);
      return { reasons: [] }; // 오류 발생 시 기본값 반환
    }
  },

  // 서비스 사용 기간 통계 조회
  getServiceDurationStats: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/service-duration');
      return response.data || { durations: [], averageDuration: 0 };
    } catch (error) {
      console.error('서비스 사용 기간 통계 조회 중 오류:', error);
      return { durations: [], averageDuration: 0 }; // 오류 발생 시 기본값 반환
    }
  },

  // 이탈률 조회
  getChurnRate: async () => {
    try {
      const response = await axiosServer.get('/api/admin/stats/withdrawals/churn-rate');
      return response.data || { dailyChurnRate: 0, weeklyChurnRate: 0, monthlyChurnRate: 0 };
    } catch (error) {
      console.error('이탈률 조회 중 오류:', error);
      return { dailyChurnRate: 0, weeklyChurnRate: 0, monthlyChurnRate: 0 }; // 오류 발생 시 기본값 반환
    }
  },
};
// 유저 외모 등급 관련 API
const userAppearance = {

  // 외모 등급 정보를 포함한 유저 목록 조회
  getUsersWithAppearanceGrade: async (params: {
    page?: number;
    limit?: number;
    gender?: 'MALE' | 'FEMALE';  // 다시 대문자로 변경
    appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
  }) => {
    try {
      console.log('유저 목록 조회 요청 파라미터:', JSON.stringify(params, null, 2));

      // URL 파라미터 구성
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.gender) {
        console.log('성별 파라미터 전송 전:', params.gender);
        queryParams.append('gender', params.gender);
      }

      // 외모 등급 파라미터 처리
      if (params.appearanceGrade) {
        console.log('외모 등급 파라미터 전송 전:', params.appearanceGrade);
        queryParams.append('appearanceGrade', params.appearanceGrade);
      }

      if (params.universityName) queryParams.append('universityName', params.universityName);
      if (params.minAge) queryParams.append('minAge', params.minAge.toString());
      if (params.maxAge) queryParams.append('maxAge', params.maxAge.toString());
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

      const url = `/api/admin/users/appearance?${queryParams.toString()}`;
      console.log('최종 API 요청 URL:', url);
      console.log('최종 쿼리 파라미터:', queryParams.toString());

      try {
        const response = await axiosServer.get(url);
        console.log('API 응답 상태:', response.status);
        console.log('API 응답 헤더:', response.headers);
        return response.data;
      } catch (error: any) {
        console.error('API 요청 실패:', error.message);
        console.error('에러 응답:', error.response?.data);
        console.error('에러 상태 코드:', error.response?.status);
        console.error('에러 헤더:', error.response?.headers);
        throw error;
      }
    } catch (error: any) {
      console.error('외모 등급 정보를 포함한 유저 목록 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      console.error('오류 상태 코드:', error.response?.status);
      console.error('요청 파라미터:', params);
      throw error;
    }
  },

  // 미분류 유저 목록 조회
  getUnclassifiedUsers: async (page: number, limit: number) => {
    try {
      const response = await axiosServer.get(`/api/admin/users/appearance/unclassified?page=${page}&limit=${limit}`);

      // 응답 데이터 로깅
      console.log('미분류 사용자 데이터 샘플:', response.data?.items?.slice(0, 2));

      return response.data;
    } catch (error) {
      console.error('미분류 유저 목록 조회 중 오류:', error);
      throw error;
    }
  },

  // 유저 외모 등급 설정
  setUserAppearanceGrade: async (userId: string, grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN') => {
    console.log('등급 설정 요청 (원본):', { userId, grade });

    // userId와 grade 유효성 검사
    if (!userId) {
      console.error('유저 ID가 없습니다.');
      throw new Error('유저 ID가 없습니다.');
    }

    if (!grade) {
      console.error('등급이 없습니다.');
      throw new Error('등급이 없습니다.');
    }

    try {
      // 요청 데이터 로깅
      const requestData = {
        userId: userId,
        grade: grade
      };
      console.log('요청 데이터 (JSON):', JSON.stringify(requestData));

      // 여러 URL 경로 시도
      let response;
      let error;

      // 첫 번째 시도: /admin/users/appearance/grade
      try {
        const url1 = '/api/admin/users/appearance/grade';
        console.log('첫 번째 시도 URL (상대 경로):', url1);
        console.log('첫 번째 시도 URL (전체 경로):', process.env.NEXT_PUBLIC_API_URL + url1);

        // 요청 헤더 로깅
        console.log('요청 헤더:', {
          'Content-Type': 'application/json',
          'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('accessToken')}` : 'N/A'
        });

        response = await axiosServer.post(url1, requestData);
        console.log('첫 번째 시도 성공!');
      } catch (err) {
        console.error('첫 번째 시도 실패:', err);
        error = err;

        // 두 번째 시도: /users/appearance/grade
        try {
          const url2 = '/api/users/appearance/grade';
          console.log('두 번째 시도 URL (상대 경로):', url2);
          console.log('두 번째 시도 URL (전체 경로):', process.env.NEXT_PUBLIC_API_URL + url2);

          response = await axiosServer.post(url2, requestData);
          console.log('두 번째 시도 성공!');
        } catch (err2) {
          console.error('두 번째 시도 실패:', err2);

          // 세 번째 시도: 직접 fetch 사용
          try {
            const url3 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045/api'}/admin/users/appearance/grade`;
            console.log('세 번째 시도 URL (전체 경로):', url3);

            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            const fetchResponse = await fetch(url3, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify(requestData)
            });

            if (!fetchResponse.ok) {
              throw new Error(`HTTP error! status: ${fetchResponse.status}`);
            }

            response = { data: await fetchResponse.json() };
            console.log('세 번째 시도 성공!');
          } catch (err3) {
            console.error('세 번째 시도 실패:', err3);
            throw error; // 원래 오류 다시 던지기
          }
        }
      }
      console.log('등급 설정 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('유저 외모 등급 설정 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      console.error('오류 상태 코드:', error.response?.status);
      console.error('오류 헤더:', error.response?.headers);
      console.error('요청 URL:', '/api/admin/users/appearance/grade');
      console.error('요청 데이터:', JSON.stringify({ userId, grade }));
      throw error;
    }
  },

  // 유저 외모 등급 일괄 설정
  bulkSetUserAppearanceGrade: async (userIds: string[], grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN') => {
    console.log('일괄 등급 설정 요청:', { userIds: userIds.length, grade });

    try {
      const response = await axiosServer.post('/api/admin/users/appearance/grade/bulk', {
        userIds,
        grade
      });
      return response.data;
    } catch (error) {
      console.error('유저 외모 등급 일괄 설정 중 오류:', error);
      throw error;
    }
  },

  // 유저 상세 정보 조회
  getUserDetails: async (userId: string) => {
    try {
      console.log('유저 상세 정보 조회 시작:', userId);

      // API 엔드포인트 (API 문서에서 확인한 정확한 경로)
      // API 문서 확인 결과, 정확한 경로는 /admin/users/detail/{userId}
      const endpoint = `/api/admin/users/detail/${userId}`;
      console.log(`API 엔드포인트: ${endpoint}`);

      // axios 설정 확인
      console.log('axios baseURL:', axiosServer.defaults.baseURL);
      console.log('전체 URL:', `${axiosServer.defaults.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`);

      const response = await axiosServer.get(endpoint);
      console.log('유저 상세 정보 응답:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('유저 상세 정보 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);

      // 오류 발생 시 예외 던지기
      throw error;
    }
  },

  // 유저 프로필 직접 수정
  updateUserProfile: async (userId: string, profileData: any) => {
    try {
      console.log('유저 프로필 수정 시작:', userId);
      console.log('프로필 수정 데이터:', profileData);

      // API 엔드포인트 (API 문서에서 확인한 정확한 경로)
      const endpoint = `/api/admin/users/profile`;
      console.log(`API 엔드포인트: ${endpoint}`);

      // 요청 데이터 구성 (API 스키마에 맞게 조정)
      const requestData = {
        userId: userId,
        ...profileData,
        // 필요한 경우 추가 필드 변환
        reason: '관리자에 의한 프로필 직접 수정'
      };

      console.log('API 요청 데이터:', requestData);

      // 여러 API 경로 시도
      let response;
      let error;

      // 첫 번째 시도: /admin/users/profile
      try {
        console.log('첫 번째 시도 URL:', endpoint);
        response = await axiosServer.post(endpoint, requestData);
        console.log('첫 번째 시도 성공!');
      } catch (err) {
        console.error('첫 번째 시도 실패:', err);
        error = err;

        // 두 번째 시도: /admin/users/detail/profile
        try {
          const url2 = '/api/admin/users/detail/profile';
          console.log('두 번째 시도 URL:', url2);
          response = await axiosServer.post(url2, requestData);
          console.log('두 번째 시도 성공!');
        } catch (err2) {
          console.error('두 번째 시도 실패:', err2);

          // 세 번째 시도: /admin/profile
          try {
            const url3 = '/api/admin/profile';
            console.log('세 번째 시도 URL:', url3);
            response = await axiosServer.post(url3, requestData);
            console.log('세 번째 시도 성공!');
          } catch (err3) {
            console.error('세 번째 시도 실패:', err3);
            throw error; // 원래 오류 다시 던지기
          }
        }
      }

      console.log('유저 프로필 수정 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('유저 프로필 수정 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);

      // 오류 발생 시 예외 던지기
      throw error;
    }
  },

  // 계정 상태 변경 (활성화/비활성화/정지)
  updateAccountStatus: async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', reason?: string) => {
    try {
      console.log('계정 상태 변경 요청:', { userId, status, reason });

      const response = await axiosServer.post('/api/admin/users/detail/status', {
        userId,
        status,
        reason
      });

      console.log('계정 상태 변경 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('계정 상태 변경 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 경고 메시지 발송
  sendWarningMessage: async (userId: string, message: string) => {
    try {
      console.log('경고 메시지 발송 요청:', { userId, message });

      const response = await axiosServer.post('/api/admin/users/detail/warning', {
        userId,
        message
      });

      console.log('경고 메시지 발송 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('경고 메시지 발송 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 강제 로그아웃
  forceLogout: async (userId: string) => {
    try {
      console.log('강제 로그아웃 요청:', { userId });

      const response = await axiosServer.post('/api/admin/users/detail/logout', {
        userId
      });

      console.log('강제 로그아웃 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('강제 로그아웃 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 계정 삭제 (새로운 API 엔드포인트 사용)
  deleteUser: async (userId: string, reason: string) => {
    try {
      console.log('계정 삭제 요청:', { userId, reason });

      // 새로운 API 엔드포인트 로깅
      const endpoint = `/api/admin/users`;
      console.log(`API 엔드포인트: ${endpoint}`);
      console.log('요청 데이터:', { userId, reason });

      // 전체 URL 로깅
      console.log('전체 URL:', `${axiosServer.defaults.baseURL}${endpoint}`);

      // DELETE 요청 수행
      console.log('DELETE 요청 시도');
      const response = await axiosServer.delete(endpoint, {
        data: { userId, reason }
      });
      console.log('DELETE 요청 성공');

      console.log('계정 삭제 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('계정 삭제 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      console.error('오류 상태 코드:', error.response?.status);

      // 오류 발생 시 다른 API 엔드포인트 시도
      try {
        console.log('대체 API 엔드포인트 시도');
        const alternativeEndpoint = `/api/admin/users/${userId}`;
        console.log(`대체 API 엔드포인트: ${alternativeEndpoint}`);

        const response = await axiosServer.delete(alternativeEndpoint, {
          data: { reason }
        });

        console.log('대체 API 요청 성공');
        console.log('계정 삭제 응답:', response.data);
        return response.data;
      } catch (alternativeError: any) {
        console.error('대체 API 요청 실패:', alternativeError);
        console.error('대체 API 오류 상세 정보:', alternativeError.response?.data || alternativeError.message);

        // 원래 오류 던지기
        throw error;
      }
    }
  },

  // 프로필 수정 요청 발송
  sendProfileUpdateRequest: async (userId: string, message: string) => {
    try {
      console.log('프로필 수정 요청 발송:', { userId, message });

      const response = await axiosServer.post('/api/admin/users/detail/profile-update-request', {
        userId,
        message
      });

      console.log('프로필 수정 요청 발송 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('프로필 수정 요청 발송 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },



  // 외모 등급 통계 조회
  getAppearanceGradeStats: async () => {
    try {
      console.log('외모 등급 통계 API 호출 시작');

      // API 엔드포인트 - API 문서에 명시된 경로 사용
      const endpoint = '/api/admin/users/appearance/stats';
      console.log(`API 엔드포인트: ${endpoint}`);

      // 토큰 확인
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      console.log('토큰 존재 여부:', !!token);

      // 캐싱 방지를 위한 타임스탬프 추가
      const timestamp = new Date().getTime();

      // API 호출 (캐싱 방지를 위한 쿼리 파라미터 추가)
      console.log('API 요청 URL:', `${endpoint}?_t=${timestamp}`);
      console.log('API 요청 헤더:', {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      });

      // 테스트 데이터 (API 응답 예시)
      const testData = {
        all: {
          S: 623,
          A: 622,
          B: 619,
          C: 619,
          UNKNOWN: 619,
          total: 3102
        },
        male: {
          S: 289,
          A: 308,
          B: 310,
          C: 311,
          UNKNOWN: 326,
          total: 1544
        },
        female: {
          S: 334,
          A: 314,
          B: 309,
          C: 308,
          UNKNOWN: 293,
          total: 1558
        }
      };

      let responseData;

      try {
        // Axios를 사용한 API 호출
        const response = await axiosServer.get(`${endpoint}?_t=${timestamp}`);
        console.log('Axios API 응답 상태 코드:', response.status);
        console.log('Axios API 응답 데이터 전체:', response.data);
        console.log('Axios API 응답 데이터 (JSON):', JSON.stringify(response.data, null, 2));

        // 응답 데이터가 비어있거나 형식이 맞지 않는 경우 테스트 데이터 사용
        if (!response.data || Object.keys(response.data).length === 0) {
          console.log('API 응답이 비어있어 테스트 데이터를 사용합니다.');
          responseData = testData;
        } else {
          responseData = response.data;
        }
      } catch (error) {
        console.error('API 호출 오류:', error);
        console.log('API 호출 오류로 테스트 데이터를 사용합니다.');
        responseData = testData;
      }

      console.log('처리할 응답 데이터:', responseData);

      // 응답 데이터 구조 변환
      const formattedData: FormattedData = {
        total: 0,
        stats: [],
        genderStats: []
      };

      // 응답 데이터가 객체인지 확인
      if (typeof responseData === 'object' && responseData !== null) {
        console.log('응답 데이터 처리 시작');
        console.log('응답 데이터 구조:', Object.keys(responseData));

        // 새로운 API 응답 구조 처리 (제공된 예시 구조)
        if (responseData.all && responseData.male && responseData.female) {
          console.log('새로운 API 응답 구조 감지');

          // 전체 통계 처리
          const allStats = responseData.all;
          formattedData.total = allStats.total || 0;

          // 등급별 통계 처리
          const grades = ['S', 'A', 'B', 'C', 'UNKNOWN'];
          formattedData.stats = grades.map(grade => {
            const count = allStats[grade] || 0;
            const percentage = allStats.total > 0 ? (count / allStats.total) * 100 : 0;

            return {
              grade,
              count,
              percentage
            };
          });

          // 성별 통계 처리
          formattedData.genderStats = [
            {
              gender: 'MALE',
              stats: grades.map(grade => {
                const count = responseData.male[grade] || 0;
                const percentage = responseData.male.total > 0 ? (count / responseData.male.total) * 100 : 0;

                return {
                  grade,
                  count,
                  percentage
                };
              })
            },
            {
              gender: 'FEMALE',
              stats: grades.map(grade => {
                const count = responseData.female[grade] || 0;
                const percentage = responseData.female.total > 0 ? (count / responseData.female.total) * 100 : 0;

                return {
                  grade,
                  count,
                  percentage
                };
              })
            }
          ];

          console.log('처리된 전체 통계:', formattedData.stats);
          console.log('처리된 성별 통계:', formattedData.genderStats);
        } else {
          console.log('기존 API 응답 구조 처리 시도');

          // 총 사용자 수 처리
          if ('total' in responseData) {
            formattedData.total = responseData.total || 0;
          } else if ('data' in responseData && 'total' in responseData.data) {
            formattedData.total = responseData.data.total || 0;
          }
          console.log('총 사용자 수 (처리 후):', formattedData.total);

          // 등급별 통계 처리
          let statsData = [];
          if (Array.isArray(responseData.stats)) {
            statsData = responseData.stats;
          } else if (responseData.data && Array.isArray(responseData.data.stats)) {
            statsData = responseData.data.stats;
          }

          console.log('등급별 통계 데이터:', statsData);

          // 백분율 계산이 되어 있지 않은 경우 계산
          formattedData.stats = statsData.map((stat: { count: number; percentage: number; grade: string }) => {
            const count = stat.count || 0;
            let percentage = stat.percentage;

            if (typeof percentage !== 'number' && formattedData.total > 0) {
              percentage = (count / formattedData.total) * 100;
            }

            return {
              grade: stat.grade,
              count: count,
              percentage: percentage || 0
            };
          });

          console.log('처리된 등급별 통계:', formattedData.stats);

          // 성별 통계 처리
          let genderStatsData = [];
          if (Array.isArray(responseData.genderStats)) {
            genderStatsData = responseData.genderStats;
          } else if (responseData.data && Array.isArray(responseData.data.genderStats)) {
            genderStatsData = responseData.data.genderStats;
          }

          console.log('성별 통계 데이터:', genderStatsData);

          formattedData.genderStats = genderStatsData.map((genderStat: { stats: any[]; gender: string }) => {
            // 각 성별별 총 사용자 수 계산
            const genderStatsArray = Array.isArray(genderStat.stats) ? genderStat.stats : [];
            const genderTotal = genderStatsArray.reduce((sum: number, stat: { count: number }) => sum + (stat.count || 0), 0);

            // 백분율 계산이 되어 있지 않은 경우 계산
            const stats = genderStatsArray.map((stat: { count: number; percentage: number; grade: string }) => {
              const count = stat.count || 0;
              let percentage = stat.percentage;

              if (typeof percentage !== 'number' && genderTotal > 0) {
                percentage = (count / genderTotal) * 100;
              }

              return {
                grade: stat.grade,
                count: count,
                percentage: percentage || 0
              };
            });

            return {
              gender: genderStat.gender,
              stats
            };
          });

          console.log('처리된 성별 통계:', formattedData.genderStats);
        }
      } else {
        console.error('응답 데이터가 객체가 아닙니다:', responseData);
      }

      // 모든 등급이 포함되어 있는지 확인하고, 없는 등급은 추가
      const allGrades = ['S', 'A', 'B', 'C', 'UNKNOWN'];

      // 전체 통계에 모든 등급 포함
      allGrades.forEach(grade => {
        if (!formattedData.stats.some(stat => stat.grade === grade)) {
          formattedData.stats.push({
            grade,
            count: 0,
            percentage: 0
          });
        }
      });

      // 성별 통계에 모든 등급 포함
      formattedData.genderStats.forEach(genderStat => {
        allGrades.forEach(grade => {
          if (!genderStat.stats.some(stat => stat.grade === grade)) {
            genderStat.stats.push({
              grade,
              count: 0,
              percentage: 0
            });
          }
        });
      });

      console.log('변환된 데이터:', formattedData);
      return formattedData;
    } catch (error: any) {
      console.error('외모 등급 통계 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      console.error('오류 상태 코드:', error.response?.status);

      // 테스트 데이터 (API 응답 예시)
      const testData = {
        all: {
          S: 623,
          A: 622,
          B: 619,
          C: 619,
          UNKNOWN: 619,
          total: 3102
        },
        male: {
          S: 289,
          A: 308,
          B: 310,
          C: 311,
          UNKNOWN: 326,
          total: 1544
        },
        female: {
          S: 334,
          A: 314,
          B: 309,
          C: 308,
          UNKNOWN: 293,
          total: 1558
        }
      };

      console.log('오류 발생으로 테스트 데이터 반환');

      // 테스트 데이터를 formattedData 형식으로 변환
      const formattedData = {
        total: testData.all.total,
        stats: [
          { grade: 'S', count: testData.all.S, percentage: (testData.all.S / testData.all.total) * 100 },
          { grade: 'A', count: testData.all.A, percentage: (testData.all.A / testData.all.total) * 100 },
          { grade: 'B', count: testData.all.B, percentage: (testData.all.B / testData.all.total) * 100 },
          { grade: 'C', count: testData.all.C, percentage: (testData.all.C / testData.all.total) * 100 },
          { grade: 'UNKNOWN', count: testData.all.UNKNOWN, percentage: (testData.all.UNKNOWN / testData.all.total) * 100 }
        ],
        genderStats: [
          {
            gender: 'MALE',
            stats: [
              { grade: 'S', count: testData.male.S, percentage: (testData.male.S / testData.male.total) * 100 },
              { grade: 'A', count: testData.male.A, percentage: (testData.male.A / testData.male.total) * 100 },
              { grade: 'B', count: testData.male.B, percentage: (testData.male.B / testData.male.total) * 100 },
              { grade: 'C', count: testData.male.C, percentage: (testData.male.C / testData.male.total) * 100 },
              { grade: 'UNKNOWN', count: testData.male.UNKNOWN, percentage: (testData.male.UNKNOWN / testData.male.total) * 100 }
            ]
          },
          {
            gender: 'FEMALE',
            stats: [
              { grade: 'S', count: testData.female.S, percentage: (testData.female.S / testData.female.total) * 100 },
              { grade: 'A', count: testData.female.A, percentage: (testData.female.A / testData.female.total) * 100 },
              { grade: 'B', count: testData.female.B, percentage: (testData.female.B / testData.female.total) * 100 },
              { grade: 'C', count: testData.female.C, percentage: (testData.female.C / testData.female.total) * 100 },
              { grade: 'UNKNOWN', count: testData.female.UNKNOWN, percentage: (testData.female.UNKNOWN / testData.female.total) * 100 }
            ]
          }
        ]
      };

      return formattedData;
    }
  }
};

// 대학교 및 학과 관련 API
const universities = {
  // 대학교 목록 조회
  getUniversities: async () => {
    try {
      console.log('대학교 목록 조회 시작');
      const response = await axiosServer.get('/api/universities');
      console.log('대학교 목록 조회 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('대학교 목록 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);

      // 오류 발생 시 실제 DB에 있는 대학교 목록 반환
      return [
        '건양대학교(메디컬캠퍼스)',
        '대전대학교',
        '목원대학교',
        '배재대학교',
        '우송대학교',
        '한남대학교',
        '충남대학교',
        'KAIST',
        '한밭대학교',
        '을지대학교',
        '대덕대학교',
        '대전과학기술대학교',
        '대전보건대학교',
        '우송정보대학'
      ];
    }
  },

  // 학과 목록 조회
  getDepartments: async (university: string) => {
    try {
      console.log('학과 목록 조회 시작:', university);
      const response = await axiosServer.get('/api/universities/departments', {
        params: { university }
      });
      console.log('학과 목록 조회 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('학과 목록 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);

      // 오류 발생 시 실제 DB에 있는 학과 목록 반환
      // 대학교에 따라 다른 학과 목록 반환
      const departmentsByUniversity: {[key: string]: string[]} = {
        '건양대학교(메디컬캠퍼스)': [
          '간호학과', '물리치료학과', '방사선학과', '병원경영학과', '안경광학과', '응급구조학과', '의공학과', '의료IT공학과', '의료공간디자인학과', '의료신소재학과', '의약바이오학과', '인공지능학과', '임상병리학과', '작업치료학과', '제약생명공학과', '치위생학과'
        ],
        '대전대학교': [
          'AI소프트웨어학부', '간호학과', '건축공학과', '건축학과(4)', '경영학부', '경찰학과', '공연예술영상콘텐츠학과', '군사학과', '디지털헬스케어학과', '물리치료학과', '물류통상학과', '반도체공학과', '법행정학부', '보건의료경영학과', '뷰티디자인학과', '비즈니스영어학과', '비즈니스일본어학과', '사회복지학과', '산업·광고심리학과', '상담학과', '소방방재학과', '스포츠건강재활학과', '스포츠운동과학과', '식품영양학과', '웹툰애니메이션학과', '응급구조학과', '임상병리학과', '재난안전공학과', '정보보안학과', '정보통신공학과', '중등특수교육과', '커뮤니케이션디자인학과', '컴퓨터공학과', '토목환경공학과', '패션디자인·비즈니스학과', '한의예과', '협화리버럴아츠칼리지', '협화커뮤니티칼리지', '화장품학과'
        ],
        '목원대학교': [
          'AI응용학과', '건축학부', '게임소프트웨어공학과', '게임콘텐츠학과', '경영학부', '경찰법학과', '경찰행정학부', '공연콘텐츠학과', '관현악학부', '광고홍보커뮤니케이션학부',
          '국악과', '국어교육과', '국际예술·한국어학부', '금융경제학과', '도시공학과', '도자디자인학과', '마케팅빅데이터학과', '미술교육과', '미술학부', '보건의료행정학과', '부동산금융보험학과',
          '사회복지학과', '산업디자인학과', '생물산업학부', '섬유·패션디자인학과', '소방방재학과', '수학교육과', '스포츠건강관리학과', '시각커뮤니케이션디자인학과', '식품제약학부', '신학과',
          '실용음악학부', '애니메이션학과', '역사학과', '연극영화영상학부', '영어교육과', '영어학과', '외식조리·제과제빵학과', '웹툰학과', '유아교육과', '음악교육과', '응급구조학과', '입체조형학부',
          '자율전공학부', '전기전자공학과', '창의예술자율전공학부', '컴퓨터공학과', '피아노학부', '항공호텔관광경영학과', '화장품학과'
        ],
        '배재대학교': [
          'IT경영정보학과', '간호학과', '건축학과', '경영학과', '경찰법학부', '공연예술학과', '관광경영학과', '광고사진영상학과', '국어국문한국어교육학과', '글로벌비즈니스학과',
          '글로벌자율융합학부(글로벌IT)', '글로벌자율융합학부(글로벌경영)', '글로벌자율융합학부(직무한국어번역)', '글로벌자율융합학부(한류문화콘텐츠)', '드론로봇공학과',
          '디자인학부(산업디자인)', '디자인학부(커뮤니케이션디자인)', '레저스포츠학부(스포츠마케팅)', '레저스포츠학부(스포츠지도·건강재활)', '미디어콘텐츠학과', '보건의료복지학과',
          '뷰티케어학과', '생명공학과', '소프트웨어공학부(게임공학)', '소프트웨어공학부(소프트웨어학)', '소프트웨어공학부(정보보안학)', '소프트웨어공학부(컴퓨터공학)', '스마트배터리학과',
          '식품영양학과', '실내건축학과', '심리상담학과', '아트앤웹툰학부(게임애니메이션)', '아트앤웹툰학부(아트앤웹툰)', '외식조리학과', '원예산림학과', '유아교육과', '의류패션학과', '일본학과',
          '자율전공학부', '전기전자공학과', '조경학과', '철도건설공학과', '평생교육융합학부(지역소상공비즈니스)', '평생교육융합학부(토털라이프스타일링)', '평생교육융합학부(토털라이프케어)',
          '항공서비스학과', '행정학과', '호텔항공경영학과'
        ],
        '우송대학교': [
          'AI·빅데이터학과', '간호학과', '글로벌조리학부 Lyfe조리전공', '글로벌조리학부 글로벌외식창업전공', '글로벌조리학부 글로벌조리전공', '글로벌호텔매니지먼트학과',
          '동물의료관리학과', '물류시스템학과', '물리치료학과', '보건의료경영학과', '뷰티디자인경영학과', '사회복지학과', '소방·안전학부', '소프트웨어학부 컴퓨터·소프트웨어전공',
          '소프트웨어학부 컴퓨터공학전공', '솔브릿지경영학부', '스포츠건강재활학과', '언어치료·청각재활학과', '외식조리영양학과', '외식조리학부 외식·조리경영전공', '외식조리학부 외식조리전공',
          '외식조리학부 제과제빵·조리전공', '외식조리학부 한식·조리과학전공', '유아교육과', '융합경영학부 경영학전공', '융합경영학부 글로벌융합비즈니스학과', '응급구조학과', '자유전공학부',
          '작업치료학과', '철도건설시스템학부 건축공학전공', '철도건설시스템학부 글로벌철도학과', '철도건설시스템학부 철도건설시스템전공', '철도경영학과', '철도시스템학부 철도소프트웨어전공',
          '철도시스템학부 철도전기시스템전공', '철도차량시스템학과', '테크노미디어융합학부 게임멀티미디어전공', '테크노미디어융합학부 글로벌미디어영상학과', '테크노미디어융합학부 미디어디자인·영상전공',
          '호텔관광경영학과', '휴먼디지털인터페이스학부'
        ],
        '한남대학교': [
          'AI융합학과', '간호학과', '건축공학전공', '건축학과(5년제)', '경영정보학과', '경영학과', '경제학과', '경찰학과', '교육학과', '국어교육과',
          '국어국문·창작학과', '기계공학과', '기독교학과', '린튼글로벌스쿨', '멀티미디어공학과', '무역물류학과', '문헌정보학과', '미디어영상학과', '미술교육과',
          '바이오제약공학과', '법학부', '빅데이터응용학과', '사학과', '사회복지학과', '사회적경제기업학과', '산업경영공학과', '상담심리학과', '생명시스템과학과', '수학과',
          '수학교육과', '스포츠과학과', '식품영양학과', '신소재공학과', '아동복지학과', '역사교육과', '영어교육과', '영어영문학과', '융합디자인학과', '응용영어콘텐츠학과',
          '일어일문학전공', '자율전공학부', '전기전자공학과', '정보통신공학과', '정치·언론학과', '중국경제통상학과', '컴퓨터공학과', '토목환경공학전공', '패션디자인학과', '프랑스어문학전공',
          '행정학과', '호텔항공경영학과', '화학공학과', '화학과', '회계학과', '회화과'
        ],
        '충남대학교': [
          '간호학과', '건설공학교육과', '건축학과(5)', '경영학부', '경제학과', '고고학과', '공공안전융합전공', '관현악과', '교육학과', '국사학과',
          '국어교육과', '국어국문학과', '국토안보학전공', '기계공학교육과', '기계공학부', '기술교육과', '농업경제학과', '도시·자치융합학과', '독어독문학과',
          '동물자원생명과학과', '디자인창의학과', '리더십과조직과학전공', '메카트로닉스공학과', '무역학과', '무용학과', '문헌정보학과', '문화와사회융합전공',
          '물리학과', '미생물·분자생명과학과', '반도체융합학과', '불어불문학과', '사학과', '사회복지학과', '사회학과', '산림환경자원학과', '생명정보융합학과', '생물과학과',
          '생물환경화학과', '생화학과', '소비자학과', '수의예과', '수학과', '수학교육과', '스마트시티건축공학과', '스포츠과학과', '식물자원학과', '식품공학과', '식품영양학과',
          '신소재공학과', '심리학과', '약학과', '언론정보학과', '언어학과', '에너지공학과', '영어교육과', '영어영문학과', '원예학과', '유기재료공학과', '음악과', '응용생물학과',
          '응용화학공학과', '의류학과', '의예과', '인공지능학과', '일어일문학과', '자율운항시스템공학과', '자율전공융합학부', '전기공학과', '전자공학과', '정보통계학과', '정치외교학과',
          '조소과', '중어중문학과', '지역환경토목학과', '지질환경과학과', '천문우주과학과', '철학과', '체육교육과', '컴퓨터융합학부', '토목공학과', '한문학과', '항공우주공학과', '해양안보학전공',
          '해양환경과학과', '행정학부', '화학공학교육과', '화학과', '환경공학과', '환경소재공학과', '회화과'
        ],
        'KAIST': [
          '기술경영학부', '기술경영학부(IT경영학)', '건설및환경공학과', '기계공학과', '바이오및뇌공학과', '반도체시스템공학과', '산업디자인학과', '산업및시스템공학과', '생명화학공학과',
          '신소재공학과', '원자력및양자공학과', '전기및전자공학부', '전산학부', '항공우주공학과', '새내기과정학부(공학계열)', '새내기과정학부(인문사회계열)', '새내기과정학부(자연계열)',
          '융합인재학부', '뇌인지과학과', '생명과학과', '디지털인문사회과학부', '물리학과', '수리과학과', '화학과'
        ],
        '한밭대학교': [
          '건설환경공학과', '건축공학과', '건축학과(5년제)', '경제학과', '공공행정학과', '기계공학과',
          '기계소재융합시스템공학과 (야)', '도시공학과', '모바일융합공학과', '반도체시스템공학과', '산업경영공학과',
          '산업디자인학과', '설비공학과', '스포츠건강과학과 (야)', '시각•영상디자인학과', '신소재공학과', '영어영문학과',
          '융합경영학과', '융합건설시스템학과 (야)', '인공지능소프트웨어학과', '일본어과', '자율전공학부', '전기공학과',
          '전기시스템공학과 (야)', '전자공학과', '정보통신공학과', '중국어과', '지능미디어공학과', '창의융합학과', '컴퓨터공학과',
          '화학생명공학과', '회계세무부동산학과 (야)', '회계세무학과'
        ],
        '을지대학교': ['의예과'],
        '대전과학기술대학교': [
          '간호학과(4년제)', '경찰경호학과', '광고홍보디자인학과', '글로벌산업학과', '도시건설과', '문헌정보과 (야)', '물리치료과', '미래문화콘텐츠과',
          '반려동물학과', '보건복지상담과', '부동산재테크과', '부동산행정정보학과', '뷰티디자인계열', '사회복지학과', '스포츠건강관리학과', '식물생활조경학과',
          '실내건축디자인과', '외식조리제빵계열', '유아교육과', '임상병리과', '전기과', '컴퓨터공학&그래픽과', '컴퓨터소프트웨어공학과', '케어복지상담과 (야)', '치위생과'
        ],
        '대전보건대학교': [
          'HiT자율전공학부', '간호학과(4년제)', '경찰과학수사학과', '국방응급의료과', '물리치료학과', '바이오의약과', '반려동물과', '방사선학과',
          '보건의료행정학과', '뷰티케어과', '사회복지학과', '스포츠건강관리과', '안경광학과', '유아교육학과', '응급구조학과', '의무부사관과(응급구조학전공)', '임상병리학과',
          '작업치료학과', '장례지도과', '재난소방·건설안전과', '치기공학과', '치위생학과', '컴퓨터정보학과', '패션컬러·스타일리스트과', '호텔조리&제과제빵과', '환경안전보건학과'
        ],
        '우송정보대학': [
          'AI응용과', 'K-뷰티학부', 'K-베이커리학부', 'K-푸드조리과', 'e-스포츠과', '간호학과', '글로벌실용예술학부', '동물보건과', '리모델링건축과', '만화웹툰과',
          '반려동물학부', '보건의료행정과', '뷰티디자인학부', '사회복지과', '산업안전과 (야)', '스마트자동차기계학부', '스마트팩토리과', '외식조리학부', '유아교육과',
          '일본외식조리학부', '자율전공학부', '재난소방안전관리과', '제과제빵과', '창업조리제빵과', '철도전기안전과', '철도차량운전과', '철도토목안전과 (야)', '호텔관광과'
        ]
      };

      // 대학교명에 따라 학과 목록 반환
      // 건양대학교(메디컬캠퍼스)의 경우 건양대학교로 키 변환
      const universityKey = university === '건양대학교(메디컬캠퍼스)' ? '건양대학교(메디컬캠퍼스)' : university;

      // 해당 대학교의 학과 목록이 있으면 반환, 없으면 기본 학과 목록 반환
      return departmentsByUniversity[universityKey] || [
        '컴퓨터공학과', '소프트웨어학과', '정보통신공학과', '전자공학과', '기계공학과',
        '건축공학과', '경영학과', '경제학과', '심리학과', '사회학과',
        '국어국문학과', '영어영문학과', '화학과', '물리학과', '생명과학과'
      ];
    }
  }
};

// 매칭 관련 API
const matching = {
  // 특정 사용자의 매칭 결과만 조회
  findMatches: async (userId: string, options?: any) => {
    try {
      console.log('사용자 매칭 결과 조회 요청:', { userId, options });

      const requestData = {
        userId,
        ...options
      };

      const response = await axiosServer.post('/api/admin/matching/user/read', requestData);
      console.log('사용자 매칭 결과 응답:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('사용자 매칭 결과 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 매칭되지 않은 사용자 조회
  getUnmatchedUsers: async (page: number = 1, limit: number = 10) => {
    try {
      console.log('매칭되지 않은 사용자 조회 요청:', { page, limit });

      const response = await axiosServer.get('/api/admin/matching/unmatched-users', {
        params: { page, limit }
      });
      console.log('매칭되지 않은 사용자 응답:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('매칭되지 않은 사용자 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 배치 매칭 처리
  processBatchMatching: async () => {
    try {
      console.log('배치 매칭 처리 요청');

      const response = await axiosServer.post('/api/admin/matching/batch');
      console.log('배치 매칭 처리 응답:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('배치 매칭 처리 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 단일 사용자 매칭 처리
  processSingleMatching: async (userId: string) => {
    try {
      console.log('단일 사용자 매칭 처리 요청:', userId);

      const requestData = {
        userId
      };

      const response = await axiosServer.post('/api/admin/matching/user', requestData);
      console.log('단일 사용자 매칭 처리 응답:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('단일 사용자 매칭 처리 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  },

  // 매칭 통계 조회 (임시 데이터)
  getMatchingStats: async (period: 'daily' | 'weekly' | 'monthly' = 'daily', university?: string) => {
    try {
      console.log('매칭 통계 조회 요청:', { period, university });

      // 실제 API가 구현되면 아래 코드로 대체
      // const response = await axiosServer.get('/admin/matching/stats', {
      //   params: { period, university }
      // });
      // return response.data;

      // 임시 데이터 반환
      const baseStats = {
        totalMatchRate: 75.5,
        maleMatchRate: 70.2,
        femaleMatchRate: 80.8,
        totalRematchRate: 45.3,
        maleRematchRate: 48.6,
        femaleRematchRate: 42.0,
        maleSecondRematchRate: 25.4,
        femaleSecondRematchRate: 22.8,
        maleThirdRematchRate: 12.3,
        femaleThirdRematchRate: 10.5,
      };

      // 대학별 통계 (임시 데이터)
      const universityStats: Record<string, any> = {
        '충남대학교': {
          totalMatchRate: 78.2,
          maleMatchRate: 72.5,
          femaleMatchRate: 83.9,
          totalRematchRate: 42.1,
          maleRematchRate: 45.3,
          femaleRematchRate: 39.0,
          maleSecondRematchRate: 23.1,
          femaleSecondRematchRate: 20.5,
          maleThirdRematchRate: 11.2,
          femaleThirdRematchRate: 9.8,
        },
        'KAIST': {
          totalMatchRate: 72.8,
          maleMatchRate: 68.4,
          femaleMatchRate: 77.2,
          totalRematchRate: 48.5,
          maleRematchRate: 51.2,
          femaleRematchRate: 45.8,
          maleSecondRematchRate: 27.6,
          femaleSecondRematchRate: 24.3,
          maleThirdRematchRate: 13.5,
          femaleThirdRematchRate: 11.2,
        },
        '한밭대학교': {
          totalMatchRate: 76.1,
          maleMatchRate: 71.3,
          femaleMatchRate: 81.0,
          totalRematchRate: 44.7,
          maleRematchRate: 47.8,
          femaleRematchRate: 41.6,
          maleSecondRematchRate: 24.9,
          femaleSecondRematchRate: 21.7,
          maleThirdRematchRate: 12.0,
          femaleThirdRematchRate: 10.1,
        },
        '한남대학교': {
          totalMatchRate: 77.3,
          maleMatchRate: 72.0,
          femaleMatchRate: 82.6,
          totalRematchRate: 43.5,
          maleRematchRate: 46.7,
          femaleRematchRate: 40.3,
          maleSecondRematchRate: 24.0,
          femaleSecondRematchRate: 21.0,
          maleThirdRematchRate: 11.7,
          femaleThirdRematchRate: 9.9,
        },
        '배재대학교': {
          totalMatchRate: 74.8,
          maleMatchRate: 69.5,
          femaleMatchRate: 80.1,
          totalRematchRate: 46.0,
          maleRematchRate: 49.2,
          femaleRematchRate: 42.8,
          maleSecondRematchRate: 25.8,
          femaleSecondRematchRate: 22.5,
          maleThirdRematchRate: 12.6,
          femaleThirdRematchRate: 10.7,
        }
      };

      // 기간별 변동 (임시 데이터)
      const periodModifier = {
        'daily': 1,
        'weekly': 0.95,
        'monthly': 0.9
      };

      // 대학이 지정된 경우 해당 대학 통계 반환, 없으면 기본 통계 반환
      const stats = university && universityStats[university]
        ? universityStats[university]
        : baseStats;

      // 기간별 변동 적용
      const modifier = periodModifier[period];
      const result: Record<string, number> = {};

      Object.entries(stats).forEach(([key, value]) => {
        result[key] = parseFloat((value as number * modifier).toFixed(1));
      });

      return result;
    } catch (error: any) {
      console.error('매칭 통계 조회 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      throw error;
    }
  }
};

const AdminService = {
  auth,
  stats,
  userAppearance,
  universities,
  matching
};

export default AdminService;
