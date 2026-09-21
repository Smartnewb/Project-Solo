jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
}));

import { dashboardService } from '@/app/services/dashboard';
import AdminService from '@/app/services/admin';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

describe('dashboard and kpi services use BFF client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads dashboard summary through adminGet', async () => {
    (adminGet as jest.Mock).mockResolvedValue({ actionItems: [] });

    await dashboardService.getSummary();

    expect(adminGet).toHaveBeenCalledWith('/admin/v2/dashboard/summary');
  });

  it('loads latest KPI report through adminGet', async () => {
    (adminGet as jest.Mock).mockResolvedValue({ week: 10, year: 2026 });

    await AdminService.kpiReport.getLatest();

    expect(adminGet).toHaveBeenCalledWith('/admin/v2/kpi-report/latest');
  });

  it('generates KPI report through adminPost', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ week: 10, year: 2026 });

    await AdminService.kpiReport.generate(2026, 10);

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/kpi-report/generate', {
      year: 2026,
      week: 10,
    });
  });

  it('loads pending university verifications through adminGet', async () => {
    (adminGet as jest.Mock).mockResolvedValue({ total: 3, users: [] });

    await AdminService.userAppearance.getUniversityVerificationPendingUsers({
      page: 1,
      limit: 1,
    });

    expect(adminGet).toHaveBeenCalledWith('/admin/v2/profile-review/university-verification/pending', {
      page: '1',
      limit: '1',
      name: '',
      university: '',
    });
  });

  it('normalizes engagement stats into the nested dashboard shape', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: {
        likesPerUser: { mean: 3.2, median: 2 },
        mutualLikesPerUser: { mean: 1.4, median: 1 },
        chatOpensPerUser: { mean: 0.8, median: 0 },
        likeEngagement: { activeUsers: 10, totalUsers: 20, rate: 50 },
        mutualLikeEngagement: { activeUsers: 6, totalUsers: 20, rate: 30 },
        chatOpenEngagement: { activeUsers: 4, totalUsers: 20, rate: 20 },
        startDate: '2026-04-01',
        endDate: '2026-04-05',
      },
    });

    await expect(
      AdminService.userEngagement.getStats('2026-04-01', '2026-04-05', false),
    ).resolves.toEqual({
      stats: {
        likesPerUser: { mean: 3.2, median: 2 },
        mutualLikesPerUser: { mean: 1.4, median: 1 },
        chatOpensPerUser: { mean: 0.8, median: 0 },
        likeEngagement: { activeUsers: 10, totalUsers: 20, rate: 50 },
        mutualLikeEngagement: { activeUsers: 6, totalUsers: 20, rate: 30 },
        chatOpenEngagement: { activeUsers: 4, totalUsers: 20, rate: 20 },
        periodEngagement: undefined,
      },
      startDate: '2026-04-01',
      endDate: '2026-04-05',
      periodType: 'custom',
    });

    expect(adminGet).toHaveBeenCalledWith('/admin/v2/stats/engagement', {
      from: '2026-04-01',
      to: '2026-04-05',
      includeDeleted: 'false',
    });
  });
});
