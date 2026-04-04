jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPatch: jest.fn(),
}));

import { profileImages, userReview } from '@/app/services/admin/moderation';
import { adminGet, adminPatch, adminPost } from '@/shared/lib/http/admin-fetch';

describe('moderation admin services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not require a JSON body for rank updates', async () => {
    (adminPatch as jest.Mock).mockResolvedValue(undefined);

    await expect(userReview.updateUserRank('user-1', 'A')).resolves.toBeUndefined();

    expect(adminPatch).toHaveBeenCalledWith('/admin/v2/profile-review/users/user-1/rank', {
      rank: 'A',
    });
  });

  it('does not require a JSON body for individual image approval', async () => {
    (adminPost as jest.Mock).mockResolvedValue(undefined);

    await expect(profileImages.approveIndividualImage('img-1')).resolves.toBeUndefined();

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/profile-review/images/img-1/action', {
      action: 'approve',
    });
  });

  it('normalizes object-like review history names into strings', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          imageId: 'img-1',
          url: 'https://example.com/image.jpg',
          slotIndex: 0,
          isMain: true,
          reviewStatus: 'approved',
          reviewType: 'admin',
          reviewerName: { id: 'admin-1', name: '운영자A' },
          reviewedAt: '2026-04-05T00:00:00.000Z',
          reason: null,
          userId: 'user-1',
          userName: { id: 'user-1', name: '홍길동' },
          gender: 'MALE',
          age: 29,
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    await expect(userReview.getReviewHistory()).resolves.toEqual({
      items: [
        {
          imageId: 'img-1',
          imageUrl: 'https://example.com/image.jpg',
          slotIndex: 0,
          isMain: true,
          reviewStatus: 'approved',
          reviewType: 'admin',
          reviewedBy: '운영자A',
          reviewedAt: '2026-04-05T00:00:00.000Z',
          rejectionReason: null,
          user: {
            userId: 'user-1',
            name: '홍길동',
            gender: 'MALE',
            age: 29,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    });
  });
});
