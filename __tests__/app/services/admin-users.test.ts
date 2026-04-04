jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPatch: jest.fn(),
  adminRequest: jest.fn(),
}));

import { userAppearance } from '@/app/services/admin/users';
import { adminGet, adminPost, adminPatch } from '@/shared/lib/http/admin-fetch';

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

  it('maps ACTIVE account status changes to unsuspend', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.updateAccountStatus('123', 'ACTIVE');

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/users/123/unsuspend', {});
  });

  it('maps suspended account status changes to suspend', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.updateAccountStatus('123', 'SUSPENDED', '운영 정지');

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/users/123/suspend', {
      reason: '운영 정지',
    });
  });

  it('records warning messages as OTHER warnings', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.sendWarningMessage('123', '경고 메모');

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/users/123/warning', {
      category: 'OTHER',
      reason: '경고 메모',
    });
  });

  it('sends profile update requests through the dedicated POST route', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.sendProfileUpdateRequest('123', '프로필을 수정해주세요.');

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/users/123/profile-update-request', {
      message: '프로필을 수정해주세요.',
    });
  });

  it('uses the instagram error set/reset endpoints', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { success: true } });

    await userAppearance.setInstagramError('123');
    await userAppearance.resetInstagramError('123');

    expect(adminPost).toHaveBeenNthCalledWith(1, '/admin/v2/users/123/instagram-error', {});
    expect(adminPost).toHaveBeenNthCalledWith(2, '/admin/v2/users/123/instagram-reset', {});
  });

  it('derives accountStatus from isSuspended in user details', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: {
        userId: '123',
        rank: 'A',
        isSuspended: true,
        status: 'approved',
        statusAt: 'instagramerror',
        images: [],
      },
    });

    await expect(userAppearance.getUserDetails('123')).resolves.toEqual(
      expect.objectContaining({
        id: '123',
        appearanceGrade: 'A',
        accountStatus: 'SUSPENDED',
        approvalStatus: 'APPROVED',
        statusAt: 'instagramerror',
      }),
    );
  });
});
