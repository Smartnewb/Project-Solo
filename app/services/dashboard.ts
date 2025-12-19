import axiosServer from '@/utils/axios';
import {
  DashboardSummaryResponse,
  MatchingFunnelResponse,
  HourlySignupsResponse,
  GoalsResponse,
  Goal,
  GoalCreateRequest,
  GoalUpdateRequest,
} from '@/app/admin/dashboard/types';

// 엔드포인트 상수
const DASHBOARD_ENDPOINT = {
  SUMMARY: '/api/admin/dashboard/summary',
  MATCHING_FUNNEL: '/api/admin/dashboard/matching/funnel',
  HOURLY_SIGNUPS: '/api/admin/dashboard/stats/signups/hourly',
  GOALS: '/api/admin/goals',  // 목표 관리는 별도 경로
} as const;

// 에러 클래스
export class DashboardApiError extends Error {
  public statusCode?: number;
  public details?: unknown;
  public originalError: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'DashboardApiError';
    this.originalError = originalError;

    if (originalError && typeof originalError === 'object' && 'response' in originalError) {
      const axiosError = originalError as { response?: { status?: number; data?: unknown } };
      this.statusCode = axiosError.response?.status;
      this.details = axiosError.response?.data;
    }
  }
}

export const dashboardService = {
  // 통합 요약 조회
  async getSummary(): Promise<DashboardSummaryResponse> {
    try {
      const response = await axiosServer.get(DASHBOARD_ENDPOINT.SUMMARY);
      return response.data;
    } catch (error) {
      console.error('대시보드 요약 조회 실패:', error);
      throw new DashboardApiError('대시보드 요약 조회에 실패했습니다.', error);
    }
  },

  // 매칭 퍼널 조회
  async getMatchingFunnel(startDate: string, endDate: string): Promise<MatchingFunnelResponse> {
    try {
      const response = await axiosServer.get(DASHBOARD_ENDPOINT.MATCHING_FUNNEL, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('매칭 퍼널 조회 실패:', error);
      throw new DashboardApiError('매칭 퍼널 조회에 실패했습니다.', error);
    }
  },

  // 시간별 가입자 추이 조회
  async getHourlySignups(date: string): Promise<HourlySignupsResponse> {
    try {
      const response = await axiosServer.get(DASHBOARD_ENDPOINT.HOURLY_SIGNUPS, {
        params: { date },
      });
      return response.data;
    } catch (error) {
      console.error('시간별 가입자 추이 조회 실패:', error);
      throw new DashboardApiError('시간별 가입자 추이 조회에 실패했습니다.', error);
    }
  },

  // 목표 목록 조회
  async getGoals(targetMonth?: string): Promise<GoalsResponse> {
    try {
      const response = await axiosServer.get(DASHBOARD_ENDPOINT.GOALS, {
        params: targetMonth ? { targetMonth } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error('목표 목록 조회 실패:', error);
      throw new DashboardApiError('목표 목록 조회에 실패했습니다.', error);
    }
  },

  // 목표 생성
  async createGoal(data: GoalCreateRequest): Promise<Goal> {
    try {
      const response = await axiosServer.post(DASHBOARD_ENDPOINT.GOALS, data);
      return response.data;
    } catch (error) {
      console.error('목표 생성 실패:', error);
      throw new DashboardApiError('목표 생성에 실패했습니다.', error);
    }
  },

  // 목표 수정
  async updateGoal(id: string, data: GoalUpdateRequest): Promise<Goal> {
    try {
      const response = await axiosServer.put(`${DASHBOARD_ENDPOINT.GOALS}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('목표 수정 실패:', error);
      throw new DashboardApiError('목표 수정에 실패했습니다.', error);
    }
  },

  // 목표 삭제
  async deleteGoal(id: string): Promise<void> {
    try {
      await axiosServer.delete(`${DASHBOARD_ENDPOINT.GOALS}/${id}`);
    } catch (error) {
      console.error('목표 삭제 실패:', error);
      throw new DashboardApiError('목표 삭제에 실패했습니다.', error);
    }
  },
};
