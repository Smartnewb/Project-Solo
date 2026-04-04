jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPatch: jest.fn(),
  adminRequest: jest.fn(),
}));

import { userAppearance } from '@/app/services/admin/users';
import { adminPost, adminPatch } from '@/shared/lib/http/admin-fetch';

describe('userAppearance service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not require a response body when updating appearance grade', async () => {
    (adminPatch as jest.Mock).mockResolvedValue(undefined);

    await expect(userAppearance.setUserAppearanceGrade('123', 'A')).resolves.toBeUndefined();

    expect(adminPatch).toHaveBeenCalledWith('/admin/v2/users/123/appearance', {
      rank: 'A',
    });
  });

  it('sends a default reason when granting gems from appearance admin', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.addUserGems('123', 5);

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/gems/users/123/add', {
      amount: 5,
      reason: '관리자 수동 구슬 지급',
    });
  });

  it('sends a provided reason when granting gems', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.addUserGems('123', 120, '운영 보상');

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/gems/users/123/add', {
      amount: 120,
      reason: '운영 보상',
    });
  });

  it('sends a default reason when deducting gems from appearance admin', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.removeUserGems('123', 3);

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/gems/users/123/deduct', {
      amount: 3,
      reason: '관리자 수동 구슬 차감',
    });
  });
});
