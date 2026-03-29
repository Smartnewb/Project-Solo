import { adminGet } from '@/shared/lib/http/admin-fetch';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface TopPageParams extends DateRange {
  limit?: number;
}

const analytics = {
  getActiveUsers: async () => {
    return adminGet<any>('/admin/analytics/active-users');
  },

  getPageViews: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/page-views', stringParams);
  },

  getTrafficSources: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/traffic-sources', stringParams);
  },

  getUserEngagement: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/user-engagement', stringParams);
  },

  getTopPages: async (params?: TopPageParams) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    if (params?.limit != null) stringParams.limit = String(params.limit);
    return adminGet<any>('/admin/analytics/top-pages', stringParams);
  },

  getUserDemographics: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/user-demographics', stringParams);
  },

  getDevices: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/devices', stringParams);
  },

  getDailyTraffic: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/daily-traffic', stringParams);
  },

  getDashboardData: async (params?: DateRange) => {
    const stringParams: Record<string, string> = {};
    if (params?.startDate) stringParams.startDate = params.startDate;
    if (params?.endDate) stringParams.endDate = params.endDate;
    return adminGet<any>('/admin/analytics/dashboard', stringParams);
  },
};

const AnalyticsService = {
  analytics
};

export default AnalyticsService;
