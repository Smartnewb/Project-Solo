import { adminDelete, adminGet, adminPost, adminPut, AdminApiError } from "@/shared/lib/http/admin-fetch";
import {
  DashboardSummaryResponse,
  MatchingFunnelResponse,
  HourlySignupsResponse,
  GoalsResponse,
  Goal,
  GoalCreateRequest,
  GoalUpdateRequest,
  ExtendedRevenueResponse,
  GemSystemFunnelResponse,
  ActionableInsightsResponse,
} from "@/app/admin/dashboard/types";

const DASHBOARD_ENDPOINT = {
  SUMMARY: "/admin/dashboard/summary",
  MATCHING_FUNNEL: "/admin/dashboard/matching/funnel",
  HOURLY_SIGNUPS: "/admin/dashboard/stats/signups/hourly",
  GOALS: "/admin/goals",
  EXTENDED_REVENUE: "/admin/dashboard/revenue/extended",
  GEM_SYSTEM_FUNNEL: "/admin/dashboard/matching/gem-system-funnel",
  ACTIONABLE_INSIGHTS: "/admin/dashboard/actionable-insights",
} as const;

export const dashboardService = {
  // 통합 요약 조회
  async getSummary(): Promise<DashboardSummaryResponse> {
    try {
      return await adminGet<DashboardSummaryResponse>(DASHBOARD_ENDPOINT.SUMMARY);
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
      return await adminGet<HourlySignupsResponse>(DASHBOARD_ENDPOINT.HOURLY_SIGNUPS, {
        date,
      });
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

  async getExtendedRevenue(): Promise<ExtendedRevenueResponse> {
    try {
      return await adminGet<ExtendedRevenueResponse>(DASHBOARD_ENDPOINT.EXTENDED_REVENUE);
    } catch (error) {
      console.error("확장 매출 현황 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("확장 매출 현황 조회에 실패했습니다.", 500);
    }
  },

  async getGemSystemFunnel(
    startDate?: string,
    endDate?: string,
    debug?: boolean,
  ): Promise<GemSystemFunnelResponse> {
    try {
      return await adminGet<GemSystemFunnelResponse>(DASHBOARD_ENDPOINT.GEM_SYSTEM_FUNNEL, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        debug: debug ? "true" : undefined,
      });
    } catch (error) {
      console.error("구슬 시스템 퍼널 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("구슬 시스템 퍼널 조회에 실패했습니다.", 500);
    }
  },

  async getActionableInsights(): Promise<ActionableInsightsResponse> {
    try {
      return await adminGet<ActionableInsightsResponse>(DASHBOARD_ENDPOINT.ACTIONABLE_INSIGHTS);
    } catch (error) {
      console.error("실행 가능한 인사이트 조회 실패:", error);
      throw error instanceof AdminApiError
        ? error
        : new AdminApiError("실행 가능한 인사이트 조회에 실패했습니다.", 500);
    }
  },
};
