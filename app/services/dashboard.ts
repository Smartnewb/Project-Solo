import { adminDelete, adminGet, adminPost, adminPut, AdminApiError } from "@/shared/lib/http/admin-fetch";
import {
  DashboardSummaryResponse,
  MatchingFunnelResponse,
  HourlySignupsResponse,
  GoalsResponse,
  Goal,
  GoalCreateRequest,
  GoalUpdateRequest,
  GemSystemFunnelResponse,
  ActionableInsightsResponse,
} from "@/app/admin/dashboard/types";

interface V2Response<T> {
  data: T;
}

const DASHBOARD_ENDPOINT = {
  SUMMARY: "/admin/v2/dashboard/summary",
  MATCHING_FUNNEL: "/admin/v2/dashboard/matching/funnel",
  HOURLY_SIGNUPS: "/admin/v2/dashboard/signups",
  GOALS: "/admin/v2/goals",
  GEM_SYSTEM_FUNNEL: "/admin/v2/dashboard/gem-system-funnel",
  ACTIONABLE_INSIGHTS: "/admin/v2/dashboard/actionable-insights",
} as const;

export const dashboardService = {
  // 통합 요약 조회
  async getSummary(): Promise<DashboardSummaryResponse> {
    try {
      const res = await adminGet<V2Response<DashboardSummaryResponse>>(DASHBOARD_ENDPOINT.SUMMARY);
      return res.data;
    } catch (error) {
      console.error("대시보드 요약 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("대시보드 요약 조회에 실패했습니다.", 500);
    }
  },

  // 매칭 퍼널 조회
  async getMatchingFunnel(
    startDate: string,
    endDate: string,
  ): Promise<MatchingFunnelResponse> {
    try {
      return await adminGet<MatchingFunnelResponse>(DASHBOARD_ENDPOINT.MATCHING_FUNNEL, {
        startDate,
        endDate,
      });
    } catch (error) {
      console.error("매칭 퍼널 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("매칭 퍼널 조회에 실패했습니다.", 500);
    }
  },

  // 시간별 가입자 추이 조회
  async getHourlySignups(date: string): Promise<HourlySignupsResponse> {
    try {
      const res = await adminGet<V2Response<HourlySignupsResponse>>(DASHBOARD_ENDPOINT.HOURLY_SIGNUPS, {
        date,
      });
      return res.data;
    } catch (error) {
      console.error("시간별 가입자 추이 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("시간별 가입자 추이 조회에 실패했습니다.", 500);
    }
  },

  // 목표 목록 조회
  async getGoals(targetMonth?: string): Promise<GoalsResponse> {
    try {
      return await adminGet<GoalsResponse>(
        DASHBOARD_ENDPOINT.GOALS,
        targetMonth ? { targetMonth } : undefined,
      );
    } catch (error) {
      console.error("목표 목록 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("목표 목록 조회에 실패했습니다.", 500);
    }
  },

  // 목표 생성
  async createGoal(data: GoalCreateRequest): Promise<Goal> {
    try {
      return await adminPost<Goal>(DASHBOARD_ENDPOINT.GOALS, data);
    } catch (error) {
      console.error("목표 생성 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("목표 생성에 실패했습니다.", 500);
    }
  },

  // 목표 수정
  async updateGoal(id: string, data: GoalUpdateRequest): Promise<Goal> {
    try {
      return await adminPut<Goal>(`${DASHBOARD_ENDPOINT.GOALS}/${id}`, data);
    } catch (error) {
      console.error("목표 수정 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("목표 수정에 실패했습니다.", 500);
    }
  },

  // 목표 삭제
  async deleteGoal(id: string): Promise<void> {
    try {
      await adminDelete(`${DASHBOARD_ENDPOINT.GOALS}/${id}`);
    } catch (error) {
      console.error("목표 삭제 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("목표 삭제에 실패했습니다.", 500);
    }
  },

  async getGemSystemFunnel(
    startDate?: string,
    endDate?: string,
    debug?: boolean,
  ): Promise<GemSystemFunnelResponse> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (debug) params.debug = "true";
      const res = await adminGet<{ data: GemSystemFunnelResponse }>(DASHBOARD_ENDPOINT.GEM_SYSTEM_FUNNEL, params);
      return res.data;
    } catch (error) {
      console.error("구슬 시스템 퍼널 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("구슬 시스템 퍼널 조회에 실패했습니다.", 500);
    }
  },

  async getActionableInsights(): Promise<ActionableInsightsResponse> {
    try {
      const res = await adminGet<{ data: ActionableInsightsResponse }>(DASHBOARD_ENDPOINT.ACTIONABLE_INSIGHTS);
      return res.data;
    } catch (error) {
      console.error("실행 가능한 인사이트 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("실행 가능한 인사이트 조회에 실패했습니다.", 500);
    }
  },
};
