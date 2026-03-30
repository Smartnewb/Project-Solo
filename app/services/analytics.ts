import { adminGet } from '@/shared/lib/http/admin-fetch';

// NOTE: GA4 analytics endpoints (page-views, traffic-sources, user-engagement,
// top-pages, user-demographics, devices, daily-traffic, dashboard) have been
// removed — GA4 is not used in this project.

const analytics = {
  getActiveUsers: async () => {
    const result = await adminGet<{ data: any }>('/admin/v2/stats/activity');
    return result.data;
  },
};

const AnalyticsService = {
  analytics
};

export default AnalyticsService;
