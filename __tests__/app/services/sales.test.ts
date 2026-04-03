jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
}));

import { salesService } from '@/app/services/sales';
import { adminGet } from '@/shared/lib/http/admin-fetch';

describe('salesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unwraps university ranking responses from the v2 proxy payload', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: {
        data: [
          {
            universityName: '테스트대학교',
            amount: 120000,
            count: 3,
            percentage: 100,
          },
        ],
        totalAmount: 120000,
        totalCount: 3,
      },
    });

    await expect(
      salesService.getUniversityRank({
        startDate: '2026-04-01',
        endDate: '2026-04-03',
        paymentType: 'all',
      }),
    ).resolves.toEqual({
      data: [
        {
          universityName: '테스트대학교',
          amount: 120000,
          count: 3,
          percentage: 100,
        },
      ],
      totalAmount: 120000,
      totalCount: 3,
    });

    expect(adminGet).toHaveBeenCalledWith(
      '/admin/v2/stats/sales/university-ranking',
      {
        startDate: '2026-04-01',
        endDate: '2026-04-03',
        paymentType: 'all',
      },
    );
  });
});
