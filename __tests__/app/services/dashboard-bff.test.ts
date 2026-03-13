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

    expect(adminGet).toHaveBeenCalledWith('/admin/dashboard/summary');
  });

  it('loads latest KPI report through adminGet', async () => {
    (adminGet as jest.Mock).mockResolvedValue({ week: 10, year: 2026 });

    await AdminService.kpiReport.getLatest();

    expect(adminGet).toHaveBeenCalledWith('/admin/kpi-report/latest');
  });

  it('generates KPI report through adminPost', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ week: 10, year: 2026 });

    await AdminService.kpiReport.generate(2026, 10);

    expect(adminPost).toHaveBeenCalledWith('/admin/kpi-report/generate', {
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

    expect(adminGet).toHaveBeenCalledWith('/admin/university-verification/pending', {
      page: '1',
      limit: '1',
      name: undefined,
      university: undefined,
    });
  });
});
