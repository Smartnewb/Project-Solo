jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPatch: jest.fn(),
}));

import { featureFlags } from '@/app/services/admin/feature-flags';
import { adminGet, adminPatch } from '@/shared/lib/http/admin-fetch';

describe('featureFlags service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes a null feature flag list to an empty array', async () => {
    (adminGet as jest.Mock).mockResolvedValue({ data: null });

    await expect(featureFlags.getAll()).resolves.toEqual([]);
  });

  it('normalizes null allowedRoles from list responses', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'flag-1',
          name: 'test_flag',
          description: 'Test flag',
          enabled: true,
          allowedRoles: null,
          country: null,
          createdAt: '2026-05-25T00:00:00.000Z',
          updatedAt: '2026-05-25T00:00:00.000Z',
        },
      ],
    });

    await expect(featureFlags.getAll()).resolves.toEqual([
      expect.objectContaining({
        name: 'test_flag',
        allowedRoles: [],
      }),
    ]);
  });

  it('normalizes null allowedRoles from toggle responses', async () => {
    (adminPatch as jest.Mock).mockResolvedValue({
      data: {
        id: 'flag-1',
        name: 'test_flag',
        description: 'Test flag',
        enabled: false,
        allowedRoles: null,
        country: null,
        createdAt: '2026-05-25T00:00:00.000Z',
        updatedAt: '2026-05-25T00:00:00.000Z',
      },
    });

    await expect(featureFlags.toggle('test_flag', false)).resolves.toEqual(
      expect.objectContaining({
        enabled: false,
        allowedRoles: [],
      }),
    );
  });
});
