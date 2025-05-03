import { adminApiClient } from '@/lib/api';
import {
  AppearanceStats,
  UniversityStats,
  GenderStats
} from '@/lib/types/api';

// 날짜 범위 파라미터
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

// 통계 서비스
const statsService = {
  // 외모 등급 통계 조회
  getAppearanceGradeStats: async (): Promise<AppearanceStats> => {
    try {
      console.log('외모 등급 통계 API 요청 시작');

      // API 요청 전 로깅
      console.log('외모 등급 통계 API 요청 URL:', '/api/admin/users/appearance/stats');

      const response = await adminApiClient.get('/api/admin/users/appearance/stats');
      console.log('외모 등급 통계 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        // 등급 목록 추출
        let grades = [];
        let total = 0;

        // 응답 구조에 따라 데이터 추출
        if (response.grades && Array.isArray(response.grades)) {
          grades = response.grades.map(grade => ({
            grade: grade.grade || '',
            count: grade.count || 0,
            percentage: grade.percentage || 0
          }));
          total = response.total || grades.reduce((sum, g) => sum + g.count, 0) || 0;
        } else if (Array.isArray(response)) {
          // 배열 형태로 응답이 오는 경우
          grades = response.map(grade => ({
            grade: grade.grade || '',
            count: grade.count || 0,
            percentage: grade.percentage || 0
          }));

          // 총 사용자 수 계산
          total = grades.reduce((sum, g) => sum + g.count, 0);

          // 백분율 재계산
          if (total > 0) {
            grades = grades.map(g => ({
              ...g,
              percentage: (g.count / total) * 100
            }));
          }
        } else if (response.distribution) {
          // distribution 객체 형태로 응답이 오는 경우
          const distribution = response.distribution;

          // 객체를 배열로 변환
          grades = Object.entries(distribution).map(([grade, count]) => ({
            grade,
            count: Number(count) || 0,
            percentage: 0 // 임시값
          }));

          // 총 사용자 수 계산
          total = grades.reduce((sum, g) => sum + g.count, 0);

          // 백분율 계산
          if (total > 0) {
            grades = grades.map(g => ({
              ...g,
              percentage: (g.count / total) * 100
            }));
          }
        }

        return {
          total,
          grades
        };
      }

      // 데이터가 없는 경우 기본값 반환
      return {
        total: 0,
        grades: []
      };
    } catch (error) {
      console.error('외모 등급 통계 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환
      return {
        total: 0,
        grades: []
      };
    }
  },

  // 성별 통계 조회
  getGenderStats: async (): Promise<GenderStats> => {
    try {
      console.log('성별 통계 API 요청 시작');

      // API 요청 전 로깅
      console.log('성별 통계 API 요청 URL:', '/api/admin/stats/users/gender');

      const response = await adminApiClient.get('/api/admin/stats/users/gender');
      console.log('성별 통계 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        // 응답 구조에 따라 데이터 추출
        const maleCount = response.maleCount || response.male?.count || 0;
        const femaleCount = response.femaleCount || response.female?.count || 0;
        const totalCount = response.totalCount || (maleCount + femaleCount) || 0;

        // 백분율 계산 (API에서 제공하지 않는 경우)
        const malePercentage = response.malePercentage ||
          (totalCount > 0 ? (maleCount / totalCount) * 100 : 0);
        const femalePercentage = response.femalePercentage ||
          (totalCount > 0 ? (femaleCount / totalCount) * 100 : 0);

        // 성비 계산 (API에서 제공하지 않는 경우)
        const genderRatio = response.genderRatio ||
          (femaleCount > 0 ? `${(maleCount / femaleCount).toFixed(1)}:1` : '0:0');

        return {
          maleCount,
          femaleCount,
          totalCount,
          malePercentage,
          femalePercentage,
          genderRatio
        };
      }

      // 데이터가 없는 경우 기본값 반환
      return {
        maleCount: 0,
        femaleCount: 0,
        totalCount: 0,
        malePercentage: 0,
        femalePercentage: 0,
        genderRatio: '0:0'
      };
    } catch (error) {
      console.error('성별 통계 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환
      return {
        maleCount: 0,
        femaleCount: 0,
        totalCount: 0,
        malePercentage: 0,
        femalePercentage: 0,
        genderRatio: '0:0'
      };
    }
  },

  // 대학별 통계 조회
  getUniversityStats: async (): Promise<UniversityStats> => {
    try {
      console.log('대학별 통계 API 요청 시작');

      // API 요청 전 로깅
      console.log('대학별 통계 API 요청 URL:', '/api/admin/stats/users/universities');

      const response = await adminApiClient.get('/api/admin/stats/users/universities');
      console.log('대학별 통계 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        // 대학 목록 추출
        let universities = [];
        let totalCount = 0;

        // 응답 구조에 따라 데이터 추출
        if (response.universities && Array.isArray(response.universities)) {
          universities = response.universities.map(uni => ({
            university: uni.universityName || uni.university || uni.name || '알 수 없음',
            totalUsers: uni.totalCount || uni.totalUsers || uni.count || 0,
            maleUsers: uni.maleCount || uni.maleUsers || 0,
            femaleUsers: uni.femaleCount || uni.femaleUsers || 0,
            percentage: uni.percentage || 0,
            genderRatio: uni.genderRatio || '0:0'
          }));
          totalCount = response.totalCount || 0;
        } else if (Array.isArray(response)) {
          // 배열 형태로 응답이 오는 경우
          universities = response.map(uni => ({
            university: uni.universityName || uni.university || uni.name || '알 수 없음',
            totalUsers: uni.totalCount || uni.totalUsers || uni.count || 0,
            maleUsers: uni.maleCount || uni.maleUsers || 0,
            femaleUsers: uni.femaleCount || uni.femaleUsers || 0,
            percentage: uni.percentage || 0,
            genderRatio: uni.genderRatio || '0:0'
          }));

          // 총 사용자 수 계산
          totalCount = universities.reduce((sum, uni) => sum + uni.totalUsers, 0);

          // 백분율 재계산
          if (totalCount > 0) {
            universities = universities.map(uni => ({
              ...uni,
              percentage: (uni.totalUsers / totalCount) * 100
            }));
          }
        }

        return {
          universities,
          totalCount
        };
      }

      // 데이터가 없는 경우 기본값 반환
      return {
        universities: [],
        totalCount: 0
      };
    } catch (error) {
      console.error('대학별 통계 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환
      return {
        universities: [],
        totalCount: 0
      };
    }
  },

  // 대시보드 데이터 조회
  getDashboardData: async (params?: DateRange): Promise<{
    overview: {
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      weeklySignups: number;
      totalMatches: number;
    };
    userGrowth: {
      date: string;
      count: number;
    }[];
    matchingStats: {
      date: string;
      count: number;
    }[];
  }> => {
    try {
      console.log('대시보드 데이터 조회 시작');

      // 개별 API 호출로 대시보드 데이터 구성
      const result = {
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          newUsers: 0,
          weeklySignups: 0,
          totalMatches: 0
        },
        userGrowth: [],
        matchingStats: []
      };

      // 총 회원 수 조회
      try {
        console.log('총 회원 수 API 요청 URL:', '/api/admin/stats/users/total');
        const totalUsersRes = await adminApiClient.get('/api/admin/stats/users/total');
        console.log('총 회원 수 API 응답:', totalUsersRes);

        if (totalUsersRes) {
          // 다양한 필드 이름 처리
          if (totalUsersRes.totalUsers !== undefined) {
            result.overview.totalUsers = totalUsersRes.totalUsers;
          } else if (typeof totalUsersRes === 'number') {
            result.overview.totalUsers = totalUsersRes;
          }
          console.log('설정된 총 회원 수:', result.overview.totalUsers);
        }
      } catch (error) {
        console.error('총 회원 수 조회 오류:', error);
      }

      // 오늘의 신규 가입 조회
      try {
        console.log('오늘의 신규 가입 API 요청 URL:', '/api/admin/stats/users/daily');
        const dailySignupsRes = await adminApiClient.get('/api/admin/stats/users/daily');
        console.log('오늘의 신규 가입 API 응답:', dailySignupsRes);

        if (dailySignupsRes) {
          // 다양한 필드 이름 처리
          if (dailySignupsRes.dailySignups !== undefined) {
            result.overview.newUsers = dailySignupsRes.dailySignups;
          } else if (typeof dailySignupsRes === 'number') {
            result.overview.newUsers = dailySignupsRes;
          }
          console.log('설정된 오늘의 신규 가입:', result.overview.newUsers);
        }
      } catch (error) {
        console.error('오늘의 신규 가입 조회 오류:', error);
      }

      // 이번 주 가입자 수 조회
      try {
        console.log('이번 주 가입자 API 요청 URL:', '/api/admin/stats/users/weekly');
        const weeklySignupsRes = await adminApiClient.get('/api/admin/stats/users/weekly');
        console.log('이번 주 가입자 API 응답:', weeklySignupsRes);

        if (weeklySignupsRes) {
          // 다양한 필드 이름 처리
          if (weeklySignupsRes.weeklySignups !== undefined) {
            result.overview.weeklySignups = weeklySignupsRes.weeklySignups;
          } else if (typeof weeklySignupsRes === 'number') {
            result.overview.weeklySignups = weeklySignupsRes;
          }
          console.log('설정된 이번 주 가입자:', result.overview.weeklySignups);
        }
      } catch (error) {
        console.error('이번 주 가입자 조회 오류:', error);
      }

      // 기타 통계 데이터는 필요에 따라 추가할 수 있습니다.

      console.log('최종 대시보드 데이터:', result);
      return result;
    } catch (error) {
      console.error('대시보드 데이터 조회 중 오류:', error);
      throw error;
    }
  },

  // 일별 트래픽 조회
  getDailyTraffic: async (params?: DateRange): Promise<{
    dailyTraffic: {
      date: string;
      visits: number;
      uniqueVisitors: number;
    }[];
  }> => {
    return adminApiClient.get('/api/admin/analytics/daily-traffic', { params });
  },

  // 사용자 인구통계 조회
  getUserDemographics: async (params?: DateRange): Promise<{
    ageGroups: {
      range: string;
      count: number;
      percentage: number;
    }[];
    genderDistribution: {
      gender: string;
      count: number;
      percentage: number;
    }[];
    universityDistribution: {
      university: string;
      count: number;
      percentage: number;
    }[];
  }> => {
    return adminApiClient.get('/api/admin/analytics/demographics', { params });
  },

  // 디바이스 정보 조회
  getDevices: async (params?: DateRange): Promise<{
    devices: {
      type: string;
      count: number;
      percentage: number;
    }[];
    browsers: {
      name: string;
      count: number;
      percentage: number;
    }[];
    operatingSystems: {
      name: string;
      count: number;
      percentage: number;
    }[];
  }> => {
    return adminApiClient.get('/api/admin/analytics/devices', { params });
  },

  // 인기 페이지 조회
  getTopPages: async (params?: DateRange & { limit?: number }): Promise<{
    pages: {
      path: string;
      title: string;
      visits: number;
      uniqueVisitors: number;
    }[];
  }> => {
    return adminApiClient.get('/api/admin/analytics/top-pages', { params });
  },

  // 총 회원 수 조회
  getTotalUsersCount: async (): Promise<{ totalUsers: number }> => {
    try {
      console.log('총 회원 수 API 요청 시작');
      console.log('총 회원 수 API 요청 URL:', '/api/admin/stats/users/total');

      const response = await adminApiClient.get('/api/admin/stats/users/total');
      console.log('총 회원 수 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        // 다양한 필드 이름 처리
        if (response.count !== undefined) {
          return { totalUsers: response.count };
        } else if (response.totalUsers !== undefined) {
          return { totalUsers: response.totalUsers };
        } else if (typeof response === 'number') {
          return { totalUsers: response };
        }
      }

      // 데이터가 없는 경우 기본값 반환
      return { totalUsers: 0 };
    } catch (error) {
      console.error('총 회원 수 조회 중 오류:', error);
      return { totalUsers: 0 };
    }
  },

  // 일별 가입자 수 조회
  getDailySignupCount: async (): Promise<{ dailySignups: number }> => {
    try {
      console.log('일별 가입자 수 API 요청 시작');
      console.log('일별 가입자 수 API 요청 URL:', '/api/admin/stats/users/daily');

      const response = await adminApiClient.get('/api/admin/stats/users/daily');
      console.log('일별 가입자 수 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        // 다양한 필드 이름 처리
        if (response.count !== undefined) {
          return { dailySignups: response.count };
        } else if (response.dailySignups !== undefined) {
          return { dailySignups: response.dailySignups };
        } else if (typeof response === 'number') {
          return { dailySignups: response };
        }
      }

      // 데이터가 없는 경우 기본값 반환
      return { dailySignups: 0 };
    } catch (error) {
      console.error('일별 가입자 수 조회 중 오류:', error);
      return { dailySignups: 0 };
    }
  },

  // 주간 가입자 수 조회
  getWeeklySignupCount: async (): Promise<{ weeklySignups: number }> => {
    try {
      console.log('주간 가입자 수 API 요청 시작');
      console.log('주간 가입자 수 API 요청 URL:', '/api/admin/stats/users/weekly');

      const response = await adminApiClient.get('/api/admin/stats/users/weekly');
      console.log('주간 가입자 수 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        // 다양한 필드 이름 처리
        if (response.count !== undefined) {
          return { weeklySignups: response.count };
        } else if (response.weeklySignups !== undefined) {
          return { weeklySignups: response.weeklySignups };
        } else if (typeof response === 'number') {
          return { weeklySignups: response };
        }
      }

      // 데이터가 없는 경우 기본값 반환
      return { weeklySignups: 0 };
    } catch (error) {
      console.error('주간 가입자 수 조회 중 오류:', error);
      return { weeklySignups: 0 };
    }
  }
};

export default statsService;
