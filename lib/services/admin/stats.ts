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
      console.log('외모 등급 통계 API 요청 URL:', '/admin/users/appearance/stats');

      const response = await adminApiClient.get('/admin/users/appearance/stats');
      console.log('외모 등급 통계 API 응답:', response);

      // 응답 데이터 확인
      if (response) {
        console.log('백엔드 응답 구조:', {
          hasAll: !!response.all,
          hasMale: !!response.male,
          hasFemale: !!response.female
        });

        // 백엔드 응답 구조 (all, male, female)를 프론트엔드 구조로 변환
        if (response.all) {
          // 전체 등급 통계 변환
          const allStats = response.all;
          const total = allStats.total || 0;

          // 등급별 통계 배열 생성
          const stats = Object.entries(allStats)
            .filter(([key]) => key !== 'total') // total 필드 제외
            .map(([grade, count]) => ({
              grade,
              count: Number(count) || 0,
              percentage: total > 0 ? (Number(count) / total) * 100 : 0
            }));

          // 성별 통계 배열 생성
          const genderStats = [];

          // 남성 통계 추가
          if (response.male) {
            const maleTotal = response.male.total || 0;
            const maleStats = Object.entries(response.male)
              .filter(([key]) => key !== 'total') // total 필드 제외
              .map(([grade, count]) => ({
                grade,
                count: Number(count) || 0,
                percentage: maleTotal > 0 ? (Number(count) / maleTotal) * 100 : 0
              }));

            genderStats.push({
              gender: 'MALE',
              stats: maleStats
            });
          }

          // 여성 통계 추가
          if (response.female) {
            const femaleTotal = response.female.total || 0;
            const femaleStats = Object.entries(response.female)
              .filter(([key]) => key !== 'total') // total 필드 제외
              .map(([grade, count]) => ({
                grade,
                count: Number(count) || 0,
                percentage: femaleTotal > 0 ? (Number(count) / femaleTotal) * 100 : 0
              }));

            genderStats.push({
              gender: 'FEMALE',
              stats: femaleStats
            });
          }

          console.log('변환된 통계 데이터:', {
            total,
            statsCount: stats.length,
            genderStatsCount: genderStats.length
          });

          return {
            total,
            stats,
            genderStats
          };
        }

        // 다른 응답 구조 처리 (이전 코드 유지)
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
          stats: grades,
          genderStats: []
        };
      }

      // 데이터가 없는 경우 기본값 반환
      return {
        total: 0,
        stats: [],
        genderStats: []
      };
    } catch (error) {
      console.error('외모 등급 통계 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환
      return {
        total: 0,
        stats: [],
        genderStats: []
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
    genderStats: {
      maleCount: number;
      femaleCount: number;
      totalCount: number;
      malePercentage: number;
      femalePercentage: number;
      genderRatio: string;
    };
    universityStats: {
      universities: {
        university: string;
        totalUsers: number;
        maleUsers: number;
        femaleUsers: number;
        percentage: number;
        genderRatio: string;
      }[];
      totalCount: number;
    };
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
        matchingStats: [],
        genderStats: {
          maleCount: 0,
          femaleCount: 0,
          totalCount: 0,
          malePercentage: 0,
          femalePercentage: 0,
          genderRatio: '0:0'
        },
        universityStats: {
          universities: [],
          totalCount: 0
        }
      };

      // 병렬로 여러 API 요청 실행
      const [
        totalUsersRes,
        dailySignupsRes,
        weeklySignupsRes,
        genderStatsRes,
        universityStatsRes,
        userActivityRes,
        matchStatsRes
      ] = await Promise.allSettled([
        // 총 회원 수 조회
        adminApiClient.get('/api/admin/stats/users/total').catch(err => {
          console.error('총 회원 수 API 오류:', err);
          return { totalUsers: 0 };
        }),

        // 오늘의 신규 가입 조회
        adminApiClient.get('/api/admin/stats/users/daily').catch(err => {
          console.error('오늘의 신규 가입 API 오류:', err);
          return { count: 0 };
        }),

        // 이번 주 가입자 수 조회
        adminApiClient.get('/api/admin/stats/users/weekly').catch(err => {
          console.error('이번 주 가입자 API 오류:', err);
          return { count: 0 };
        }),

        // 성별 통계 조회
        adminApiClient.get('/api/admin/stats/users/gender').catch(err => {
          console.error('성별 통계 API 오류:', err);
          return null;
        }),

        // 대학별 통계 조회
        adminApiClient.get('/api/admin/stats/users/universities').catch(err => {
          console.error('대학별 통계 API 오류:', err);
          return null;
        }),

        // 사용자 활동 지표 조회
        adminApiClient.get('/api/admin/stats/users/activity').catch(err => {
          console.error('사용자 활동 지표 API 오류:', err);
          return { activeUsers: 0 };
        }),

        // 매칭 통계 조회
        adminApiClient.get('/api/admin/stats/match-stats').catch(err => {
          console.error('매칭 통계 API 오류:', err);
          return { totalMatches: 0 };
        })
      ]);

      // 총 회원 수 처리
      if (totalUsersRes.status === 'fulfilled' && totalUsersRes.value) {
        const data = totalUsersRes.value;
        console.log('총 회원 수 API 응답:', data);

        // 다양한 필드 이름 처리
        if (data.totalUsers !== undefined) {
          result.overview.totalUsers = data.totalUsers;
        } else if (data.count !== undefined) {
          result.overview.totalUsers = data.count;
        } else if (typeof data === 'number') {
          result.overview.totalUsers = data;
        }
        console.log('설정된 총 회원 수:', result.overview.totalUsers);
      }

      // 오늘의 신규 가입 처리
      if (dailySignupsRes.status === 'fulfilled' && dailySignupsRes.value) {
        const data = dailySignupsRes.value;
        console.log('오늘의 신규 가입 API 응답:', data);

        // 다양한 필드 이름 처리
        if (data.dailySignups !== undefined) {
          result.overview.newUsers = data.dailySignups;
        } else if (data.count !== undefined) {
          result.overview.newUsers = data.count;
        } else if (typeof data === 'number') {
          result.overview.newUsers = data;
        }
        console.log('설정된 오늘의 신규 가입:', result.overview.newUsers);
      }

      // 이번 주 가입자 수 처리
      if (weeklySignupsRes.status === 'fulfilled' && weeklySignupsRes.value) {
        const data = weeklySignupsRes.value;
        console.log('이번 주 가입자 API 응답:', data);

        // 다양한 필드 이름 처리
        if (data.weeklySignups !== undefined) {
          result.overview.weeklySignups = data.weeklySignups;
        } else if (data.count !== undefined) {
          result.overview.weeklySignups = data.count;
        } else if (typeof data === 'number') {
          result.overview.weeklySignups = data;
        }
        console.log('설정된 이번 주 가입자:', result.overview.weeklySignups);
      }

      // 성별 통계 처리
      if (genderStatsRes.status === 'fulfilled' && genderStatsRes.value) {
        const data = genderStatsRes.value;
        console.log('성별 통계 API 응답:', data);

        // 응답 구조에 따라 데이터 추출
        const maleCount = data.maleCount || data.male?.count || 0;
        const femaleCount = data.femaleCount || data.female?.count || 0;
        const totalCount = data.totalCount || (maleCount + femaleCount) || 0;

        // 백분율 계산 (API에서 제공하지 않는 경우)
        const malePercentage = data.malePercentage ||
          (totalCount > 0 ? (maleCount / totalCount) * 100 : 0);
        const femalePercentage = data.femalePercentage ||
          (totalCount > 0 ? (femaleCount / totalCount) * 100 : 0);

        // 성비 계산 (API에서 제공하지 않는 경우)
        const genderRatio = data.genderRatio ||
          (femaleCount > 0 ? `${(maleCount / femaleCount).toFixed(1)}:1` : '0:0');

        result.genderStats = {
          maleCount,
          femaleCount,
          totalCount,
          malePercentage,
          femalePercentage,
          genderRatio
        };

        console.log('설정된 성별 통계:', result.genderStats);
      }

      // 대학별 통계 처리
      if (universityStatsRes.status === 'fulfilled' && universityStatsRes.value) {
        const data = universityStatsRes.value;
        console.log('대학별 통계 API 응답:', data);

        // 대학 목록 추출
        let universities = [];
        let totalCount = 0;

        // 응답 구조에 따라 데이터 추출
        if (data.universities && Array.isArray(data.universities)) {
          universities = data.universities.map(uni => ({
            university: uni.universityName || uni.university || uni.name || '알 수 없음',
            totalUsers: uni.totalCount || uni.totalUsers || uni.count || 0,
            maleUsers: uni.maleCount || uni.maleUsers || 0,
            femaleUsers: uni.femaleCount || uni.femaleUsers || 0,
            percentage: uni.percentage || 0,
            genderRatio: uni.genderRatio || '0:0'
          }));
          totalCount = data.totalCount || 0;
        } else if (Array.isArray(data)) {
          // 배열 형태로 응답이 오는 경우
          universities = data.map(uni => ({
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

        result.universityStats = {
          universities,
          totalCount
        };

        console.log('설정된 대학별 통계:', result.universityStats);
      }

      // 사용자 활동 지표 처리
      if (userActivityRes.status === 'fulfilled' && userActivityRes.value) {
        const data = userActivityRes.value;
        console.log('사용자 활동 지표 API 응답:', data);

        // 다양한 필드 이름 처리
        if (data.activeUsers !== undefined) {
          result.overview.activeUsers = data.activeUsers;
        } else if (data.count !== undefined) {
          result.overview.activeUsers = data.count;
        } else if (typeof data === 'number') {
          result.overview.activeUsers = data;
        }

        console.log('설정된 활성 사용자 수:', result.overview.activeUsers);
      }

      // 매칭 통계 처리
      if (matchStatsRes.status === 'fulfilled' && matchStatsRes.value) {
        const data = matchStatsRes.value;
        console.log('매칭 통계 API 응답:', data);

        // 다양한 필드 이름 처리
        if (data.totalMatches !== undefined) {
          result.overview.totalMatches = data.totalMatches;
        } else if (data.count !== undefined) {
          result.overview.totalMatches = data.count;
        } else if (typeof data === 'number') {
          result.overview.totalMatches = data;
        }

        console.log('설정된 총 매칭 수:', result.overview.totalMatches);
      }

      // 회원가입 추이 데이터 조회 (일별)
      try {
        const signupTrendRes = await adminApiClient.get('/api/admin/stats/users/trend/daily');
        console.log('회원가입 추이 API 응답:', signupTrendRes);

        if (signupTrendRes && Array.isArray(signupTrendRes)) {
          result.userGrowth = signupTrendRes.map(item => ({
            date: item.date,
            count: item.count || 0
          }));
        } else if (signupTrendRes && signupTrendRes.data && Array.isArray(signupTrendRes.data)) {
          result.userGrowth = signupTrendRes.data.map(item => ({
            date: item.date,
            count: item.count || 0
          }));
        }

        console.log('설정된 회원가입 추이:', result.userGrowth);
      } catch (error) {
        console.error('회원가입 추이 조회 오류:', error);

        // 기본 데이터 생성
        const today = new Date();
        result.userGrowth = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 1
          };
        }).reverse();
      }

      // 매칭 추이 데이터 조회
      try {
        const matchTrendRes = await adminApiClient.get('/api/admin/stats/match-history');
        console.log('매칭 추이 API 응답:', matchTrendRes);

        if (matchTrendRes && Array.isArray(matchTrendRes)) {
          result.matchingStats = matchTrendRes.map(item => ({
            date: item.date,
            count: item.count || 0
          }));
        } else if (matchTrendRes && matchTrendRes.data && Array.isArray(matchTrendRes.data)) {
          result.matchingStats = matchTrendRes.data.map(item => ({
            date: item.date,
            count: item.count || 0
          }));
        }

        console.log('설정된 매칭 추이:', result.matchingStats);
      } catch (error) {
        console.error('매칭 추이 조회 오류:', error);

        // 기본 데이터 생성
        const today = new Date();
        result.matchingStats = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 5) + 1
          };
        }).reverse();
      }

      console.log('최종 대시보드 데이터:', result);
      return result;
    } catch (error) {
      console.error('대시보드 데이터 조회 중 오류:', error);

      // 오류 발생 시 기본 데이터 반환
      const today = new Date();
      const defaultUserGrowth = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        };
      }).reverse();

      const defaultMatchingStats = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5) + 1
        };
      }).reverse();

      return {
        overview: {
          totalUsers: 120,
          activeUsers: 45,
          newUsers: 8,
          weeklySignups: 32,
          totalMatches: 78
        },
        userGrowth: defaultUserGrowth,
        matchingStats: defaultMatchingStats,
        genderStats: {
          maleCount: 65,
          femaleCount: 55,
          totalCount: 120,
          malePercentage: 54.2,
          femalePercentage: 45.8,
          genderRatio: '1.2:1'
        },
        universityStats: {
          universities: [
            {
              university: '충남대학교',
              totalUsers: 35,
              maleUsers: 20,
              femaleUsers: 15,
              percentage: 29.2,
              genderRatio: '1.3:1'
            },
            {
              university: '한남대학교',
              totalUsers: 28,
              maleUsers: 15,
              femaleUsers: 13,
              percentage: 23.3,
              genderRatio: '1.2:1'
            },
            {
              university: '배재대학교',
              totalUsers: 22,
              maleUsers: 12,
              femaleUsers: 10,
              percentage: 18.3,
              genderRatio: '1.2:1'
            },
            {
              university: '목원대학교',
              totalUsers: 18,
              maleUsers: 9,
              femaleUsers: 9,
              percentage: 15.0,
              genderRatio: '1:1'
            },
            {
              university: '대전대학교',
              totalUsers: 17,
              maleUsers: 9,
              femaleUsers: 8,
              percentage: 14.2,
              genderRatio: '1.1:1'
            }
          ],
          totalCount: 120
        }
      };
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
  },

  // 일별 회원가입 추이 조회
  getDailySignupTrend: async (): Promise<{ data: { date: string; count: number }[] }> => {
    try {
      console.log('일별 회원가입 추이 API 요청 시작');

      // API 요청 전 로깅
      console.log('일별 회원가입 추이 API 요청 URL:', '/api/admin/stats/users/trend/daily');

      const response = await adminApiClient.get('/api/admin/stats/users/trend/daily');
      console.log('일별 회원가입 추이 API 응답:', response);

      // 응답 데이터 확인
      if (response && response.data && Array.isArray(response.data)) {
        return { data: response.data };
      } else if (Array.isArray(response)) {
        return { data: response };
      }

      // 데이터가 없는 경우 기본값 반환 (최근 30일 더미 데이터 생성)
      const dummyData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dummyData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        });
      }
      console.log('일별 회원가입 추이 더미 데이터 생성:', dummyData);
      return { data: dummyData };
    } catch (error) {
      console.error('일별 회원가입 추이 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환 (최근 30일 더미 데이터 생성)
      const dummyData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dummyData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        });
      }
      console.log('일별 회원가입 추이 더미 데이터 생성 (오류 발생 시):', dummyData);
      return { data: dummyData };
    }
  },

  // 주간 회원가입 추이 조회
  getWeeklySignupTrend: async (): Promise<{ data: { week: string; count: number }[] }> => {
    try {
      console.log('주간 회원가입 추이 API 요청 시작');

      // API 요청 전 로깅
      console.log('주간 회원가입 추이 API 요청 URL:', '/api/admin/stats/users/trend/weekly');

      const response = await adminApiClient.get('/api/admin/stats/users/trend/weekly');
      console.log('주간 회원가입 추이 API 응답:', response);

      // 응답 데이터 확인
      if (response && response.data && Array.isArray(response.data)) {
        return { data: response.data };
      } else if (Array.isArray(response)) {
        return { data: response };
      }

      // 데이터가 없는 경우 기본값 반환 (최근 12주 더미 데이터 생성)
      const dummyData = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);

        dummyData.push({
          week: `${date.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`,
          count: Math.floor(Math.random() * 50) + 10
        });
      }
      console.log('주간 회원가입 추이 더미 데이터 생성:', dummyData);
      return { data: dummyData };
    } catch (error) {
      console.error('주간 회원가입 추이 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환 (최근 12주 더미 데이터 생성)
      const dummyData = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);

        dummyData.push({
          week: `${date.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`,
          count: Math.floor(Math.random() * 50) + 10
        });
      }
      console.log('주간 회원가입 추이 더미 데이터 생성 (오류 발생 시):', dummyData);
      return { data: dummyData };
    }
  },

  // 월별 회원가입 추이 조회
  getMonthlySignupTrend: async (): Promise<{ data: { month: string; count: number }[] }> => {
    try {
      console.log('월별 회원가입 추이 API 요청 시작');

      // API 요청 전 로깅
      console.log('월별 회원가입 추이 API 요청 URL:', '/api/admin/stats/users/trend/monthly');

      const response = await adminApiClient.get('/api/admin/stats/users/trend/monthly');
      console.log('월별 회원가입 추이 API 응답:', response);

      // 응답 데이터 확인
      if (response && response.data && Array.isArray(response.data)) {
        return { data: response.data };
      } else if (Array.isArray(response)) {
        return { data: response };
      }

      // 데이터가 없는 경우 기본값 반환 (최근 12개월 더미 데이터 생성)
      const dummyData = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        dummyData.push({
          month: `${year}-${month.toString().padStart(2, '0')}`,
          count: Math.floor(Math.random() * 200) + 50
        });
      }
      console.log('월별 회원가입 추이 더미 데이터 생성:', dummyData);
      return { data: dummyData };
    } catch (error) {
      console.error('월별 회원가입 추이 조회 중 오류:', error);

      // 오류 발생 시 기본값 반환 (최근 12개월 더미 데이터 생성)
      const dummyData = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        dummyData.push({
          month: `${year}-${month.toString().padStart(2, '0')}`,
          count: Math.floor(Math.random() * 200) + 50
        });
      }
      console.log('월별 회원가입 추이 더미 데이터 생성 (오류 발생 시):', dummyData);
      return { data: dummyData };
    }
  }
};

export default statsService;
