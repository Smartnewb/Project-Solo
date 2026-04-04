import { adminDelete, adminGet, adminPost, adminPut, AdminApiError } from "@/shared/lib/http/admin-fetch";
import {
  DashboardSummaryResponse,
  MatchingFunnelResponse,
  HourlySignupsResponse,
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
      const response = await adminGet<V2Response<MatchingFunnelResponse>>(DASHBOARD_ENDPOINT.MATCHING_FUNNEL, {
        startDate,
        endDate,
      });
      return response.data;
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
